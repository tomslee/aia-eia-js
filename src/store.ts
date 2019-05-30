import Vue from "vue";
import Vuex, { StoreOptions } from "vuex";
import VuexPersistence from "vuex-persist";
import { RootState } from "./types";
import { IQuestion, QuestionSelectBase, SurveyModel } from "survey-vue";
import isEmpty from "lodash.isempty";

Vue.use(Vuex);

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: (state: RootState) => ({
    toolData: state.toolData,
    currentPageNo: state.currentPageNo
  })
});

function addItemsInArray(val: any[]) {
  let total = 0;
  val.forEach(item => {
    if (typeof item === "number") {
      total = total + item;
    } else if (typeof item === "string") {
      total = total + parseEmbeddedValue(item);
    }
  });
  return total;
}

function hasScore(question: IQuestion): boolean {
  if (
    question.getType() === "radiogroup" ||
    question.getType() === "checkbox" ||
    question.getType() === "dropdown"
  ) {
    // Check the suffix for "-RS" or "-MS" for valid score questions.
    return getScoreType(question) > 1;
  }
  return false;
}

function parseEmbeddedValue(val: String): number {
  const lastHyphenIdx = val.lastIndexOf("-");
  if (lastHyphenIdx !== -1) {
    // Suffix after last "-" could be a number.
    const value = Number(val.substr(lastHyphenIdx + 1));
    return isNaN(value) ? 0 : value;
  }

  return 0;
}

function getValue(val: any) {
  if (val === undefined) {
    return 0;
  }

  if (Array.isArray(val)) {
    return addItemsInArray(val);
  }

  if (typeof val === "string") {
    return parseEmbeddedValue(val);
  }

  if (typeof val !== "number") {
    return 0;
  }

  return val;
}

function getScoreTypeHelper(name: String): Number {
  // 1 - Not Scored, 2 - Raw Score, 3 - Mitigation Score
  if (name) {
    if (name.endsWith("-RS")) {
      return 2;
    } else if (name.endsWith("-MS")) {
      return 3;
    } else if (name.endsWith("-NS")) {
      return 1;
    }
  }

  return 0;
}

function getScoreType(question: IQuestion): Number {
  const result = getScoreTypeHelper(question.name);

  if (result > 0) {
    return result;
  }

  const parentResult = getScoreTypeHelper(question.parent.name);

  if (parentResult == 0) {
    // Treat at no score.
    return 1;
  }

  return parentResult;
}

function getMaxScoreForQuestion(question: QuestionSelectBase): number {
  const questionType = question.getType();
  let maxScore = 0;
  let value = 0;
  if (questionType == "radiogroup" || questionType == "dropdown") {
    question.choices.forEach(item => {
      value = getValue(item.itemValue);
      if (maxScore < value) {
        maxScore = value;
      }
    });
  } else if (questionType == "checkbox") {
    question.choices.forEach(item => {
      value = getValue(item.itemValue);
      maxScore += value;
    });
  }

  return maxScore;
}

import Score from "@/interfaces/Score";

function getLevel(total: number, rawRiskScore: Score): number {
  const threshold1 = 0.25;
  const threshold2 = 0.5;
  const threshold3 = 0.75;
  if (total <= rawRiskScore.max * threshold1) {
    return 1;
  } else if (
    total > rawRiskScore.max * threshold1 &&
    total <= rawRiskScore.max * threshold2
  ) {
    return 2;
  } else if (
    total > rawRiskScore.max * threshold2 &&
    total <= rawRiskScore.max * threshold3
  ) {
    return 3;
  } else {
    return 4;
  }
}

function getTotal(mitigationScore: Score, rawRiskScore: Score) {
  const percentage = 0.8;
  const deduction = 0.15;

  //maxMitigationScore is divided by 2 because of Design/Implementation fork
  if (mitigationScore.actual >= percentage * (mitigationScore.max / 2)) {
    return Math.round((1 - deduction) * rawRiskScore.actual);
  }

  return rawRiskScore.actual;
}

function calculateFinalScore(
  survey: SurveyModel,
  questionNames: string[]
): number[] {
  const rawRiskScore: Score = {
    actual: 0,
    max: 0
  };

  const mitigationScore: Score = {
    actual: 0,
    max: 0
  };

  questionNames.forEach(name => {
    const currentQuestion: QuestionSelectBase = survey.getQuestionByName(
      name
    ) as QuestionSelectBase;

    const calculateScore = (score: Score) => {
      score.actual += getValue(survey.data[name]);
      score.max += getMaxScoreForQuestion(currentQuestion);
    };

    const currentQuestionType = getScoreType(currentQuestion);

    if (currentQuestionType === 2) {
      calculateScore(rawRiskScore);
    } else if (currentQuestionType === 3) {
      calculateScore(mitigationScore);
    }
  });

  const total = getTotal(mitigationScore, rawRiskScore);
  return [
    rawRiskScore.actual,
    mitigationScore.actual,
    total,
    getLevel(total, rawRiskScore)
  ];
}

const store: StoreOptions<RootState> = {
  plugins: [vuexLocal.plugin],
  state: {
    answerData: [],
    result: undefined,
    currentPageNo: 0,
    toolData: {},
    questionNames: []
  },
  mutations: {
    resetSurvey(state: RootState) {
      state.answerData = [];
      state.result = undefined;
      state.currentPageNo = 0;
      state.toolData = {};
    },
    updateResult(state: RootState, result: SurveyModel) {
      state.result = result;
      state.currentPageNo = result.currentPageNo;
      //freeze this data so we can load from localStorage
      state.toolData = Object.freeze(result.data);
      state.answerData = result.getPlainData({
        includeEmpty: false
      });

      if (state.questionNames.length === 0) {
        state.questionNames = result
          .getAllQuestions()
          .filter(question => {
            return hasScore(question);
          })
          .map(question => {
            return question.name;
          });
      }
    }
  },
  getters: {
    inProgress: state => {
      return !isEmpty(state.toolData);
    },
    calcscore: state => {
      if (state.result === undefined) return [0, 0, 0];
      return calculateFinalScore(state.result, state.questionNames);
    },
    resultDataSections: state => {
      if (state.result === undefined) return {};

      const projectResults: any[] = [];
      const riskResults: any[] = [];
      const mitigationResults: any[] = [];
      const mitigationResultsYes: any[] = [];

      state.answerData.forEach(function(result) {
        const question = state.result!.getQuestionByName(result.name);
        const scoreType = getScoreType(question);

        if (
          scoreType === 1 &&
          question.parent.name === "projectDetailsPanel-NS"
        ) {
          projectResults.push(result);
        } else if (scoreType === 2) {
          riskResults.push(result);
        } else if (scoreType === 3) {
          mitigationResults.push(result);
          if (result.value > 0) {
            mitigationResultsYes.push(result);
          }
          if (typeof result.value === "string") {
            const val = getValue(result.value);
            if (val > 0) {
              mitigationResultsYes.push(result);
            }
          }
        }
      });

      return [
        projectResults,
        riskResults,
        mitigationResults,
        mitigationResultsYes
      ];
    }
  }
};

export default new Vuex.Store<RootState>(store);

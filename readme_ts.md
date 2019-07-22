# To run

> npm install
> npm run serve

Then browse to http://localhost:8080.

# To change the questions

> cd src
> gvim survey-enfr.yaml
> y2j.bat

# Strings

* src/plugins/en.json holds string definitions. Also holds the requirements for different levels, under the following categories:
  - Peer review
  - Notice
  - Human-in-the-loop for decisions
  - Explanation requirement
  - Testing
  - Monitoring, which is the same in all cases
  - Training
  - Contingency planning, in case of system unavailability
  - Approvals to operate

* Looks like src\views\Home.vue does the import of other files, but it doesn't hold the image.

* The scoring logic seems to be in src/store.ts. There is a hasScore for each question that checks if it is a text box (no score).  getScoreType() calls getScoreTypeHelper which checks the name of each question (or its parent panel): -RS, -MS, -NS. for each question.

Each response has the score encoded: item1-2 is a score of two. 

* Multiple choice checkboxes have a "max score".

The project is built on vue.js. "Vue.js is an open-source JavaScript framework for building user interfaces and single-page applications."


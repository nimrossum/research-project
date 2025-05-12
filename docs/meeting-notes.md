## Links

- [Google Drive folder](https://drive.google.com/drive/u/0/folders/14_hkvGLv1B6kgYD88CwfXwF-TJuoUK3Q)
- [Kanban board](https://github.com/users/nimrossum/projects/6/views/1)
- [Course LearnIT Page](https://learnit.itu.dk/course/view.php?id=3024480)
- [Project LearnIT Page](https://learnit.itu.dk/course/view.php?id=3025580)

## Jonas / Mircea / Christian



## 19/02/2024 - Jonas / Mircea

- I demonstrated a prototype of the commit relative NCD with a bar chart
- We talked about the preliminary project statement.

We agreed that I should
- [x] [Write a few more paragraphs in Google Doc](https://docs.google.com/document/d/1GWE0E9LZUC1zFc5d_3je2C2UeV9eOUVD_ALruHIAtNs/edit?tab=t.0)
  - https://intranet.itu.dk/Teaching-Guide/Supervision/Preliminary-Problem-Statement
- [x] [Fill out Supervision agreement](https://docs.google.com/document/d/1GWE0E9LZUC1zFc5d_3je2C2UeV9eOUVD_ALruHIAtNs/edit?tab=t.0#heading=h.m4fojbefwub1)
  - https://itustudent.itu.dk/Study-Administration/Project-Work/Your-supervisor-and-supervision
- [x] Send them to Mircea by 19/02/2024
- [x] Mircea will provide feedback by 20/02/2024
- [ ] Share project statement with Christian


## 25/02/2024 - Jonas / Mircea

Agenda:

- In a bit of a rut, project feels underwhelming and I don't feel like I am making progress
- Feels like there is a lot of trial and error, mostly error, which is not really interesting to write about
- Still not convinced whether this is a useful metric to compute, at least with the current idea
- Not sure what to focus on at this point
- Christian just send a mail about a fast python version he wrote for calculating ncd relative to final revision

Questions about report:

- [ ] How many pages should I write?
- [ ] What do you expect in the report


## 11/03/2024 - Jonas / Mircea

To do
- [ ] Find subjectively "important" commits and compare with the "jump in distance"
  - [ ] Create a spreadsheet with subjectively top 10 most interesting commits and 10 most boring commits
  - [ ] Find 20 commits that have "high information contribution" (adding something interesting), 20 commits that are "low information contribution" (formatting)
    - [ ] Calculate LoC and NCD
  - [ ] Equally distributed throughout the lifetime of the project

- [ ] Precision: Find outliers, do they make sense?
  - [ ] Recall: Define our own subjective i
- [ ] Run the method, **distance between previous commit to this commit**
- [ ] Compare with LoC

- [ ] Write about the method - Compression in a Google Doc
  - [ ] In this mini experiment, we tried to find ....
  - [ ] We used this code and this is what we found out
- [ ] Find big "jumps in distance" and see if those commits seem important - be aware of bias
- [ ] A lot of boring code / formatting -> does that lead to a
- [ ]

- [ ] Email mircea with update
- [ ] How many pages should I write in the report?
- [ ]

## 02/05/2024 - Jonas / Mircea

Focus: CD delta vs categories

- [ ] Make sure LoCC data is correct
  - [ ]
- [ ] Make process more ergonomic / automatic
  - [ ] Automatically detect top 1 extensions (this might be a problem for commits that)

- [ ] Manually Classify Zeeguu web commits
- [ ] Manually Reclassify Git Truck commits
- [ ] Manually Classify more Git Truck commits


Observation: This method is robust to merge commits, merge commits do not report any changes with numstat, but this method does not look at numstat, so it is not affected by this.


## 08/05/2024 - Jonas / Mircea

Observations:
- Automatic extension detection is not perfect, only detects CS code in twooter, but python and yml is also present.
- **Relevant for the final version is different from judging work by itself.**
- Important: What is the research question?

Future work:

- Analyze pull requests
- Correlate with reactions in GitHub





What i did since last time:

- Continued analysis
- 100 commits from twooter, git-truck
- Computed cd delta, looked at correlation between interesting / boring and cd delta


Problems: Some commits

Focus:
- Fix LoCC bugs
  - 2e05c1a9fd0c094b7e25aeba128de60a78c67081 Add deferred loading and prefetching (#734)
  - has +1 -1, but in GitHub +476 -206
  - Test case: http://localhost:3000/get-commits/?repo=git-truck&branch=2e05c1a9fd0c094b7e25aeba128de60a78c67081&count=1




- We are not distinguishing between formatting or not,

- Is it not robust to formatting?
- [ ] Prepare a commit that does formatting and how large CD it has

- Work backwards to find the research question
  - From the data: What is the problem, describe it well and describe the solution.
  - Clearly define the problem and answer the research question
  - What is the problem we are trying to solve?
  - Think about the main research question: Do we want to look at the comparison to final revision or the commit itself?


Report:
- Present problem
- Present metric
  - Correlation between CD delta and complexity
- Present method
- Present implementation


- Ping Mircea when I have a draft


Data TODO
- Filter out commits that do not have changes to the filtered extensions
- Instead of interesting / boring
  - Minor / major commit
  - Complex change / simple change
  - 

# 12/05/2025

![image](https://github.com/user-attachments/assets/de66d189-cf9e-43a3-9d79-7b7f6c1b2903)



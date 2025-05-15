#import "@preview/ilm:1.4.1": *
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *

#show: codly-init.with()

#codly(
  number-format: none,
  display-name: false,
)
#set text(lang: "en")

#show: ilm.with(
  title: [KIREPRO1PE \ \ Compression of Programs and the Similarity Distance],
  author: "Jonas Nim Røssum <jglr@itu.dk>",
  date: datetime(year: 2025, month: 05, day: 15),
  abstract: [
    #text(weight: "bold")[Supervisor:]
    Mircea Lungu \<mlun\@itu.dk\>
    // - One line of context & the gap (why LoCC isn't enough).
    // - One line of “what we did” (introduced CD).
    // - One line of your key quantitative result (e.g. correlation coefficients, discrimination power).
    //   - Add clear, concise statement of your key quantitative results (e.g. “We found that CD correlates at ρ = 0.72 with expert judgements, versus LoCC's ρ = 0.45”).
    // - One line of the take-home (“CD can serve as a complementary metric…“).
    //   - No final “conclusion” sentence (“CD can serve as a complementary or alternative metric to LoCC in X contexts”).
    \
    \
    #text[
      Lines of code changed (LoCC) is one of the most widely used distance metrics in the software industry, but it suffers from several key drawbacks that can mislead when analyzing developer effort and project activity. In this paper, we have explored the shortcomings of LoCC and propose an alternative metric: Compression Distance, $"CD"(x,y) = |C(x)| - |C(x #sym.union y)|$ derived from Normalized Compression Distance (NCD) and lossless compression algorithms with large search windows. The CD metric has been presented as a complementary metric for information distance to traditional methods like LoCC.
      The results suggest that CD provides a more nuanced and robust measure of software evolution, to be used as a complementary metric to proven metrics like LoCC, while being aware of the biases in the metric.
    ]
  ],
  preface: [
    #align(center + horizon)[
      #box(
        width: 127mm,
        [
          _They took away the old timbers from time to time, and put new and sound ones in their places, so that the vessel became a standing illustration for the philosophers in the mooted question of growth, some declaring that it *remained the same, others that it was not the same vessel.*_
          \
          \
          —  Plutarch, Life of Theseus 23.1
        ],
      )
    ]
  ],
  bibliography: bibliography("refs.bib"),
  figure-index: (enabled: true),
  table-index: (enabled: true),
  listing-index: (enabled: true),
)


= Introduction <sec:introduction>

Software engineering has consistently explored metrics to measure and compare the complexity and evolution of software systems. Being able to quantify the impact of code changes in software systems is central to understanding software evolution, team productivity, and system complexity. There are many ways to quantify the impact of code changes. Among these, _Lines of code changed_ (LoCC) @Sourceli1:online is one of the most widely used distance metrics in the software industry @nguyen2007sloc. It is often used as a measure of software complexity, maintainability, and productivity.

While LoCC is simple to compute and interpret, it suffers from several key drawbacks that can mislead when analyzing developer effort and project activity. In this paper, we will explore the shortcomings of LoCC and propose an alternative metric: Compression Distance (CD), derived from lossless compression algorithms with large search windows. By measuring the compressibility of changes between software revisions, CD offers a novel perspective on software evolution, addressing many of the shortcomings inherent in LoCC.

Through a series of experiments, we evaluate the effectiveness of CD in quantifying code complexity, distinguishing between commit types, and mitigating biases present in LoCC.

The results suggest that CD provides a more nuanced and robust measure of software evolution, paving the way for its adoption in both academic research and industry practice. However, you need to be aware of built in biases in the metric.

== Research Questions <researchQuestions>
This paper investigates three research questions (RQs):
- RQ1: Is the compression distance a more representative metric for quantifying the complexity of a version-controlled software repository than LoCC?
- RQ2: To what extent does compression distance discriminate between manual or semi-automatic commit types (e.g., bugfix, feature, refactoring, documentation, style)?
- RQ3: Does compression distance suffer from the same limitations as LoCC in quantifying the contributions of developers?


== Contributions & Paper Organization
We make the following contributions:
- We define Compression Distance (CD), a distance metric based on lossless compression, and derive its per-commit delta ($#sym.Delta"CD"$).
- We implement CD computation as API endpoints in the Git Truck analysis tool, leveraging ZStandard with a 2 MB search window.
- We empirically evaluate CD on two projects (Git Truck and Commitizen), showing varying correlation with LoCC, improved discrimination of commit types, and distinct author-level insights.

The remainder of the paper is organized as follows. @sec:background reviews LoCC and its limitations. @sec:approach presents our proposed CD metric and its theoretical foundation. @sec:methodology details the methodology: data collection, metric computation, commit classification, and statistical analyses. @sec:results reports results for RQ1-RQ3. @sec:discussion discusses implications, practical considerations, and limitations. Finally, Section 7 concludes and outlines directions for future work.


= Background <sec:background>

== Information distance and Similarity Distance Metrics in Software Engineering
// - Why measuring software-change distance matters; common use of LoCC
In the field of information theory, the concept of _information distance_ is used to quantify the similarity between two objects @Informat56:online. This is done by measuring the amount of information needed to transform one object into another using a mathematical function $F$. The most common way to measure this distance is by using a _distance metric_, which is a function that quantifies the difference between two objects.

While such a function $F$ only exists in theory, we can still approximate the information distance between two objects using various practical techniques such as diffing and compression algorithms, as we will explore in this paper.

=== LoCC as a measure of information distance

Since many projects utilize version control systems, such as Git @Git46:online, for keeping track of changes, we can track LoCC over time using diffing algorithms. The LoCC metric is typically defined as the number of lines added and removed in a commit. This provides a measure of the information distance between revisions of a software system. Git includes this functionality by default using the numstat argument. @Gitgitlo53:online. This is a commonly used technique used to detect activity in software systems over time @goeminne2013analyzing. It can be used to assess team velocity, developer productivity and more. These metrics can be automatically obtained via version control systems using tools like Git Truck@hojelse2022git. LoCC is a useful metric for quantifying contributions or regions of interest in software systems over time and tools like Git Truck have shown the effectiveness of LoCC in the analysis of software evolution @lungu2022can, @neyem2025exploring.

=== Shortcomings of LoCC

There are however multiple problems when relying on LoCC as a sole metric of productivity.

==== First problem: Ambiguous LoCC definitions <loccDef>

Firstly, the term itself is ambiguous and subjective to the formatting of the code. One could say that line breaks are just an arbitrary formatting character. In reality, the program could have been written in a single line of code.

See the following ambiguous examples in @ambiguousListings. A few questions arise: should these snippets be counted as three separate lines of code or collapsed into a single line? In terms of actual work, a developer who writes either version is equally productive, yet if we simply count physical lines changed, the author of the first listing would be credited with three times the contribution of the second. This discrepancy shows how formatting alone can skew LoCC-based distance measures, as trivial style differences inflate the perceived distance between revisions and undermine the metric's reliability.


#figure(
  caption: [Three semantically equivalent code snippets with different physical line counts],
  grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 10pt,
    rows: 60pt,
    ```javascript
    if (foo) {
      bar();
    }
    ```,
    ```javascript
    if (foo) { bar(); }



    ```,
    ```javascript
    if (foo) bar();



    ```,
  ),
) <ambiguousListings>

==== Second problem: Rename-detection pitfalls <renamePitfalls>

The LoCC metric can be distorted also by file renames, which may artificially inflate contribution counts, since renaming a file requires little effort but appears as significant line changes. Git supports rename detection using a similarity threshold#footnote[https://git-scm.com/docs/git-log#Documentation/git-log.txt-code-Mltngtcode], comparing deleted and added files to identify likely renames, utilized by tools such as Git Truck. While Git doesn't exclude renames by default, this tracking can be used to filter them out manually. However, rename detection is inherently ambiguous — at what point should we stop treating a change as a rename and instead count it as having deleted the old file and added a new one?#footnote[https://en.wikipedia.org/wiki/Ship_of_Theseus]

The issue is further exacerbated when developers squash commits, potentially losing rename information. Ultimately, it's a trade-off between inflating the impact of trivial renames and missing substantial, legitimate contributions.

==== Third problem: Automation-driven LoCC spikes <automationDrivenSpikes>

Another case where the LoCC metric falls short is when performing automated actions that affects a vast amount of files and leads to spikes in line changes. Examples of this include running formatting and linting scripts or automated lock file updates when installing packages, all of which can lead to astronomical amounts of line changes. These kinds of changes do not directly reflect genuine development effort, but they still result in high LoCC values from which one often draw this conclusion. As an illustrative example, see @filesAffectedByAutomation for a visualization from the tool Git Truck showing accumulated line changes per file. Notice how the file "package-lock.json" is dominating the rest of the files, due to it being an auto generated file that is modified automatically by package managers in the JavaScript ecosystem. This is an example of line changes that should to be disregarded.

#figure(
  caption: [Screenshot of Git Truck @github-git-truck:online visualizing accumulated line changes per file. More vibrant colors indicate larger amounts of LoCC],
  image("assets/files-affected-by-automation.png"),
) <filesAffectedByAutomation>


If the developers practice good Git hygiene (such as keeping commits small and focused, not using squash merging, and writing descriptive commit or conventional commit messages#footnote([Some projects conform to conventional commit messages using tools like Commitizen @github-commitizen:online])), you can perform filtering to focus on for example commits fixing bugs, refactoring or implementing features, but in reality, not all teams conform to these practices.

This shows why this metric cannot stand alone as a measure of productivity. This may cause the results to be misinterpreted, overstating the activity levels of certain developers or areas of the system.

==== Fourth problem: Survivorship bias <timeBias>

Another problem with the LoCC metric is that it is _not_ time biased. This means that if a developer made a lot of changes to a file in the past, but then later removed all of them, they would still be credited for all of those changes, even though they are not present in the current version of the file. This is a problem when trying to analyze the history of a project and understand how it has evolved over time. Tools like Git Truck track LoCC through the entire history of a project by default, weighing ancient changes as much as recent changes. In the development of Git Truck, this was attempted to be mitigated by looking at blame information#footnote[https://github.com/git-truck/git-truck/commit/12582272b5854d6bf23706b292f3519750023fdd] instead and only considering how the files that are still present in the system as of today has changed through time. However, this technique is still prone to the errors introduced by the problem stated in @renamePitfalls. Another attempt to solve this was the introduction of the time range slider#footnote[https://github.com/git-truck/git-truck/pull/731], which led the user select a duration of time to analyze and ignore past changes in analysis.


= Approach <sec:approach>

To mitigate the explored problems with LoCC, we can use a different approach to measure the distance between revisions of a software system. Instead of relying on the number of lines changed, we can use a metric derived from lossless compression algorithms, to measure the distance between revisions.

== Mitigating the problem of ambiguous definitions of LoCC and rename-detection pitfalls

To mitigate the ambiguity described in @loccDef, we can instead consider the change in the number of bytes instead of LoCC as a quantifier of developer activity.

However, this means we can no longer rely on line-based diffing algorithms, akin to those used in Git @Gitdiffo88:online and must use an alternative method to measure the distance between revisions.

We can mitigate the problem with ambiguity and renames by concatenating all the files existing in each commit into a single file buffer. We will refer to this as the concatenated commit buffer, $"CCB"$. We can measure its size before and after the commit to calculate a *byte distance metric*, see @byte-distance-metric.

$ #sym.Delta"D"(x) = |x| - |x-1| $ <byte-distance-metric>

where $#sym.Delta"D"(x)$ is the distance in bytes, $|x|$ is the size of the given commit buffer and $x-1$ is the size of the previous commit buffer.

This method does not address the problem with automatic actions overstating developer impact.

This leads us to the Compression Distance.

== Mitigating the problem of automation-driven LoCC spikes

Instead of measuring the static distance in bytes before and after the commit, we can instead try to measure the compression of the changes we added. Using a lossless compression algorithm, we compress the concatenation of the given commit buffer $x$ with the newest revision of the project $y$ and compare this value with the one for the previous commit $x-1$. The hypothesis being that this would make it such that large repetitive actions would have a lower impact, since they would compress better than smaller, but more complex changes. This assumes that the changes added in a commit will compress better in the presence of similar code. This requires the compression algorithm to have search window larger than double the size of the project files we intend to analyze, as explored in @cebrian2005common.


== Definition of Compression Distance

We define the Compression Distance $"CD"$ metric as a measure of how much a given concatenated commit buffer compresses with the baseline commit buffer:

$ "CD"(x, y) = |C(x)| - |C(x #sym.union y)| $ <def:compression_distance>



where $"CD"$ is the compression distance, $x$ is the given concatenated commit buffer and $"Z"$ is a lossless compression algorithm.

Now we can define the impact of the commit $#sym.Delta"CD"$, compared to the previous commit buffer, giving us

$ #sym.Delta"CD" = "CD"(x) - "CD"(x-1) $ <def:compression_distance_delta>

Unlike the normalized compression distance, this metric is not bounded and is dependent on the absolute sizes of the compressed files. This is fine in this scenario, as we want to compare commits in the same project and the magnitude of the compression distance tells us an interesting story about the impact of the commit.

Then, we can compute the change in the size in bytes before and after the commit.

// Describe the method, how we compare the distance to the newest version

If we attempt to compress the commit buffers in presence of the newest commit buffer of the repository, we get the side effect of introducing survivorship bias into the system. By measuring the compressed distance to the newest commit buffer of the project, we value changes that are more akin to the newest version higher, in order to tell a story about how we got to the newest version and which commits were the most influential in getting there. For some purposes this makes sense, as long as you are aware of survivorship bias. For example, a detour in the project that didn't make it in the newest version is weighted by a negative distance, telling us this brought the project further away from the newest version, but it might still have been a valuable journey to take with the project. See @deltaCDZeeguu for a diagram showing how some commits increase the distance from the final version.

#figure(
  caption: [Waterfall diagram showing ∆CD for the latest 100 commits in the repository #link("https://github.com/zeeguu/api", "github.com/zeeguu/api")],
  image("assets/∆CD for github.com_zeeguu_api.svg"),
) <deltaCDZeeguu>

== Mitigating survivorship bias in compression distance

If we intend to value these types of detours better, we can use the magnitude of the distance instead, which then gives us the impact of the commit, no matter if it moved the project closer or further from the project.

To mitigate these problems, we can use an alternative approach where we concatenate the entire state of the repository, makes the analysis resistant to renames, as we don't care about file names, we only care about the bytes contained in the commit. However, in this case, we can no longer rely on diffing the concatenated string. We need to use another approach to derive the information distance from before and after a commit.

== Normalized Compression Distance <NCD>

Normalized Compression Distance (NCD) @Normaliz98:online is a effective way of measuring the similarity between two compressible objects, using lossless compression algorithms such as ZStandard. It is a way of approximating the Normalized Information Distance and has widespread uses, such as clustering analysis @cilibrasi2004clusteringcompression.

According to @cebrian2005common, NCD is an effective distance measurement, as long as it is used properly, which can be achieved if you understand how compression algorithms work. Most compression algorithms use a sliding window of context from which to compare new data to old data, in order to limit memory consumption. If the size of this window is too small, matches might not be found and the data might not compress as well. Since we are using the compression to quantify the similarity, it is crucial that we use a compression algorithm with support for a window size that exceeds the size of the data that we want to compare. In fact, if we compare two version of an object to determine how it has changed over time, we need a window size twice the size of the largest version of the object, in order to not overlook shared patterns.

However, nobody has used NCD based distance metrics in version control system analysis yet. The hypothesis of this project is that NCD-derived metrics could function as a complement to the more well-known LoCC metric, and be resilient to the problems that LoCC suffers from.

= Methodology <sec:methodology>

== Data collection

During this project, the analysis tools were implemented as API endpoints exposed in the Git Truck project @gittruck76:online. This was done due to the foundation for performing git analysis were already readily available in Git Truck project, which sped up the development of the tools.

We used these endpoints to collect and visualize data about different repositories to draw conclusions about the Compression Distance metric.

=== Repository Selection

For the analysis of this project, two differently sized projects were chosen. Git Truck was chosen, as we were familiar with its history and knew that an attempt was made to conform to good practices of making git commits, such as using the imperative mood etc., which made categorizing the commits simpler. Commitizen was chosen as well, due to its nature of conforming to the use of Conventional Commits @Conventi81:online, which automatically could be categorized.

The different versions of Git Truck where chosen due to the known time periods on which the project was worked on by a previously known set of contributors.

From @git-repositories, we see that all the chosen repositories lie below the maximum of 1MB, which ensures that sliding search window of the compression algorithm is able to take the repositories in their entireties into account, as mentioned in @NCD.


#figure(
  caption: [Git repositories and revisions that were chosen for this project and some of their properties],
  table(
    // columns: (4.4cm, 2cm, 1.9cm, 0.9fr),
    columns: 4,
    align: (left, left, right, right, right),

    [*Repository\@revision*],
    [*Commits*],
    [*Hash*],
    [*Buffer size*],
    [Git Truck\@ncd @github-git-truck:online], "1,356", "bf46e09", $0.365 "MB"$, // 383292/((2^10)^2) = 0.365535736
    [Git Truck\@v2.0.4 @github-git-truck:online], "1,260", "d385ace", $0.318 "MB"$, //333644/((2^10)^2) = 0.318
    [Git Truck\@v1.13.0 @github-git-truck:online], "1,242", "71ae30d", $0.259 "MB"$, // 270329/((2^10)^2) = 0.259
    [Commitizen\@master @github-commitizen:online], "1,977", "e177141", $0.771 "MB"$ // 808691/((2^10)^2) = 0.771
  ),
) <git-repositories>

=== File Inclusion/Exclusion
// Specify which file extensions to include or drop, and how unrecognized types are handled.

We chose to include/exclude certain file extensions, to focus the results on code files.

In general, file extensions commonly associated with code were included, while binary files like images, videos, and audio files as well as miscellaneous files were excluded @gittruck0:online.

If any extensions were found that were neither included nor excluded, an automatic warning was reported in the console, in order to consider whether it should be included or excluded.

=== API Data retrieval

The tool is able to go through a specified range of the history of a git repository and compute metrics for each commit.

The current version of the tool is as of writing not published yet and has to be run manually by cloning the source code.

Queries can be performed using query parameters like so:
Among other metrics, the endpoint is able to compute the Compression Distance in relation to the baseline commit, the newest commit at the given revision in the repository.

- Repository can be specified using the $"repo=<folder>"$ parameter#footnote[The repo parameter refers to a specific git repository folder located relative to where the tools was downloaded.]
- Baseline branch or revision is specified with the $"branch=<revision>"$ parameter.
- Amount of commits to analyze is specified using the $"count"=N|"Infinity"$ parameter, going backwards from $"branch"$#footnote[Passing Infinity as count makes the tool go through all the commits in the given repository.]

To generate the data for this project, the following queries were used:

#figure(
  caption: [Parameters used to gather the analysis data],
  table(
    columns: 3,
    table.header([*Repository*], [*Branch*], [*Count*]),
    [git-truck], [ncd], [Infinity],
    [git-truck], [v2.0.4], [Infinity],
    [git-truck], [v1.13.0], [Infinity],
    [commitizen], [master], [Infinity],
  ),
)
This produces a CSV output that can be processed in a data processing tool. During this project, Google Sheets was used for this purpose. Useful information and progress updates is reported in the console.

== Metric Computation

In this section, we describe the detailed steps to compute Compression Distance (CD) for each commit. The process is divided into four sub-sections:

=== Concatenated Commit Buffer (CCB) Construction
// Describe how you assemble the full-repository byte string per commit.
We begin by constructing a concatenated commit buffer (CCB) for every commit, reading all the file contents into a single buffer. The contents of the files are obtained via the `git cat-file <blob hash>` command and reading the standard output of the command.

=== Compression Setup
// zstd version, compression level (3), window size 2^21 B, memory limits.

Next, we compress each CCB and its paired baseline buffer using ZStandard (zstd) @zstdlibc51:online.

The ZStandard compression algorithm (zstd) @facebook31:online, has a window log of 21 @zstdlibc51:online for its default 3 level compression, making the window size $2^21 = 2"MB"$. This makes zstd suitable for this task, as long as you are aware of the limit and remember to adjust it as needed.

We used the default compression level of 3, which has a window size of $2^(21) B = 2 "MB"$.

We checked that the repositories we used were smaller than half of this size#footnote("Due to compressing the newest commit buffer with each commit, meaning we need at least 2x the baseline buffer, assuming that no commit buffer is larger than the final buffer, but there is still some wiggle room for all of the projects, as none of them surpass 1 MB"), in order for the compression algorithm to consider the entire commit buffer when attempting to compress it.


=== Calculating $"CD"$ & $#sym.Delta"CD"$

We then calculate the Compression Distance using @def:compression_distance. Then, to get the compressed distance contribution for each commit, we simply subtract it with the compression distance from the previous commit as seen in @def:compression_distance_delta.

This method adds intentional survivorship bias into the metric, favoring code that is more easily compressible with the final version.

== Commit Classification

Using keyword searching, we were able to categorize the many of the commits automatically. For the Commitizen repository, all the commits were automatically categorized due to the nature of conforming to Conventional Commits. We used the following keywords for categorizing the commits:

For Commitizen, we used: Test, Fix, Feat, Refactor, Style, Docs, as

For Git Truck, we used: Bump, Refactor, Fix, Feature.

== Statistical Analysis
// Methods: Spearman's ρ, regression, boxplots; significance tests; tools/libraries used.

We evaluated whether per-commit $#sym.Delta"CD"$ aligns with traditional complexity measured by LoCC. For each repository, we created log-log scatter plots with linear trend-lines and computed the coefficient of determination, $R^2$, between $#sym.Delta"CD"$ and LoCC across all commits.


= Results <sec:results>

In this section, we will explore whether we have answered the research questions presented in @researchQuestions, provided here for convenience:

- RQ1: Is the compression distance a more representative metric for quantifying the complexity of a version-controlled software repository than LoCC?
- RQ2: To what extent does compression distance discriminate between manual or semi-automatic commit types (e.g., bugfix, feature, refactoring, documentation, style)?
- RQ3: Does compression distance suffer from the same limitations as LoCC in quantifying the contributions of developers?

The data used to answer these questions is published in Google Sheets @Research78:online, @Subjecti71:online.

== RQ1: LoCC vs. $#sym.Delta"CD"$ Correlation <RQ1Findings>

To answer RQ1, we will explore newest version of each repository and see how the CD metric correlates with LoCC.

=== Correlation Results

#figure(
  caption: [Correlation between LoCC and $#sym.Delta"CD"$],
  table(
    columns: 4,
    align: (left, left, right, right),
    table.header([*Project*], [*Revision*], [*$R^2$, linear*], [*$R^2$, power*]),
    [Git Truck], [ncd], $0.825$, $0.494$,
    [Commitizen], [master], $0.297$, $0.506$,
  ),
) <loccVsDeltaCompDist>

From @loccVsDeltaCompDist, it seems that for Git Truck, there exists a linear correlation between LoCC and $#sym.Delta"CD"$, however for Commitizen, a power regression produces a better correlation.

== RQ2: Discrimination Across Commit Types <RQ2Findings>

=== $#sym.Delta"CD"$ Distributions by Category

For this experiment, we will look at the Commitizen repository.
If we plot each category of commit as a series on a log-log scatter-plot, we can see some interesting patterns. See @commitizenDeltaCompDistVSLoCC.

#figure(
  caption: [Log-log scatter-plot of commits in the Commitizen repository, with automatically categorized commits],
  image("assets/commitizenCD∆ vs LoCC.svg"),
) <commitizenDeltaCompDistVSLoCC>

From the plot, we can see that bug fix commits specifically has a tendency to have a lower $#sym.Delta"CD"$ metric.

We can also see that version bumps vary much less in impact compared to the other categories.
Feature commits generally have a larger LoCC than other commits, and might contain more novel code that compress less, compared to bug fixes.

== RQ3: Developer Contribution Analysis <RQ3Findings>

For this experiment, we will look at the Git Truck repository across two time periods and see whether survivorship bias plays a role in $#sym.Delta"CD"$.

We accumulate the byte distance, LoCC and $#sym.Delta"CD"$ for each developer throughout the two time periods.

We then aggregate each metric for each contributor throughout the history of the repository.

For context, Git Truck was initially developed by a group of four developers. Later, the project was continuously contributed to several developers, and even later Thomas contributed to the project during his their master thesis.

We will compare the project before and after the master thesis by Thomas.

=== Author-Level Aggregates


#figure(
  caption: [Cumulative LoCC and $#sym.Delta"CD"$ \ Left: Before master thesis (v1.13.0), Right: after (v2.0.4)],
  grid(
    columns: 2,
    gutter: 1cm,
    table(
      columns: 3,
      table.header(
        [*author*],
        [*$#sym.Delta"CD"$*],
        [*locc*],
      ),

      "Jonas", "54.987%", "62.370%",
      "Thomas", "21.425%", "15.719%",
      "Emil", "15.793%", "13.482%",
      "Kristoffer", "7.124%", "7.625%",
      "Mircea", "0.670%", "0.155%",
    ),
    table(
      columns: 3,
      table.header(
        [*author*],
        [*$#sym.Delta"CD"$*],
        [*locc*],
      ),

      "Jonas", "47.069%", "58.908%",
      "Thomas", "46.636%", "24.148%",
      "Emil", "3.260%", "10.021%",
      "Dawid", "3.241%", "1.856%",
      "Kristoffer", "0.341%", "4.134%",
    ),
  ),
) <beforeAndAfterTThesisTable>

See @beforeAndAfterTThesis for the distribution over cumulative byte distance, LoCC and $#sym.Delta"CD"$ over the two time periods. See @beforeAndAfterTThesisTimeSeries for how the cumulative distribution has changes over time.



#figure(
  caption: [Pie charts of the cumulative author distribution before (top) and after (bottom) the thesis project by Thomas. \ Left: Cumulative Byte Distance, Center: Cumulative $#sym.Delta"CD"$, Right: Cumulative LoCC],
  grid(
    columns: 1,
    gutter: 1cm,
    image("assets/before_thesis.png"),
    image("assets/after_thesis.png"),
  ),
) <beforeAndAfterTThesis>

#figure(
  caption: [
    Cumulative area charts of the author distribution over time. \
    Overlap (top), stacked (middle) stacked 100% (bottom) \
    $#sym.Delta"CD"$ based (left) and LoCC based (right)
  ],
  grid(
    columns: 2,
    rows: 3,
    gutter: 1cm,
    image("assets/CDD no stack.svg"), image("assets/LoCC no stack.svg"),
    image("assets/CDD stack.svg"), image("assets/LoCC stack.svg"),
    image("assets/CDD stack100.svg"), image("assets/LoCC stack100.svg"),
  ),
) <beforeAndAfterTThesisTimeSeries>

=== 5.3.3 Observations: Survivorship Bias Skew

We observe that before Thomas worked intensively on the project, his contribution distributions measured in LoCC and $#sym.Delta"CD"$ were fairly close, however, after his thesis, his share of accumulated $#sym.Delta"CD"$ equalized with that of Jonas.

This is also clear to see on the area time series charts in @beforeAndAfterTThesisTimeSeries. We can see that using the $#sym.Delta"CD"$ metric, Thomas is able to surpass Jonas in the author distribution. We can also clearly see when Thomas merged his master thesis into the repository and that the merge technique was squashing all of the commits into one, hence the big spike upwards and long period of few commits. This clearly illustrates the information that is lost when developers choose squash merging over regular merges or rebase merging strategies. This is a limitation that neither LoCC, $#sym.Delta"CD"$ or any other metric can preserve, unless the commits are recovered by rebasing them back into the branch.

= Discussion <sec:discussion>

== Interpretation of RQ1 Findings
// Summarize what the correlation between $#sym.Delta"CD"$ and LoCC tells us about CD's representativeness
// Discuss whether CD better captures complexity than LoCC and under what conditions

In @RQ1Findings, we observed that there was not necessarily a clear correlation between LoCC and $#sym.Delta"CD"$, which tells us that the two metrics measure different things and have their own purpose.

== Interpretation of RQ2 Findings
// Explain how $#sym.Delta"CD"$ varies across commit types (Test, Fix, Feat, etc.)
// Reflect on CD's ability to discriminate intent compared to LoCC

In @RQ2Findings, we observed that certain types of commits contribute more information to the codebase than others. This is intuitive, as introducing a novel feature typically adds more unique content than modifying existing code for bug fixes or version bumps.

== Interpretation of RQ3 Findings
// Analyze the author-level CD vs. LoCC aggregates
// Discuss cases where CD highlights contributions that LoCC misses (and vice versa)

There are several hypothesis for the differences observed in @RQ3Findings. Since Thomas changed a lot of the codebase during his thesis work, the survivorship bias of the metric favor his recent changes, when judging the history of the project. Another part of the explanation might be that his thesis entailed adding a database to Git Truck, contributing a lot of SQL code to an already TypeScript dominated project, which might also explain the large spike in the $#sym.Delta"CD"$ attribution to Thomas. The hypothesis being that contributing SQL code to the codebase will compress worse than contributing TypeScript code.

This demonstrates the built in survivorship bias that the metric includes and illustrate how you need to be aware of this when using the metric for judging work. For judging work done in group projects, one should select time ranges that correspond to the period of work during the project.

We see that if we measure the author distribution based on cumulative $#sym.Delta"CD"$ contributions, we get survivorship bias built into the metric, which tells us more about who contributed the most to get the system in its current state.

== Practical Implications
// Implications for software teams: tool adoption, commit practices, metric dashboards
// Recommendations for integrating CD into CI pipelines or code-review workflows

This study has shown that if implemented with caution for compression window sizes and built in bias, a metric like the compression distance has its place in the arsenal of metrics used in analyzing software evolution. It's a viable supplement to existing metrics and might especially be useful for assessing student projects, as long as detours in the project are also noticed.

== Considerations for End users

While measuring automatic velocity is a good idea, it is not the only thing to consider. For a user facing project, it is important to also consider the user experience and the impact of changes on the end users. Some small bug fix might have a small impact on the code, but a large impact on the end user.


== Limitations
// Performance overhead and scalability constraints
// Effects of compression window size and survivorship bias
// Generalizability to very large repos or non-code file
//

There are however some limitations to this approach, that makes it less desirable compared to alternatives, depending on the needs.

=== Performance:

We've found that, at least with the current implementation, compressed distance is much slower to compute than traditional metrics like LoCC built in to Git Truck. For example, analyzing the entire history of Commitizen in Git Truck was measured to take $1.55#sym.plus.minus 0.07$ seconds, while it takes $374.28#sym.plus.minus 5.41$ seconds for the proposed tool in its current state, making it a $#sym.approx 250$ times slower metric in this scenario.

=== Scalability

For very large repositories, it becomes unfeasible to calculate the compression distance for the entire project at once, as it requires a lot of memory and processing power. This is due to the fact that the compression algorithm needs to keep track of the entire state of the repository in memory. The limited window size @cebrian2005common leading to distorted distance measurements, especially in worst case when comparing identical objects exceeding these size constraints. This means that we are back to just measuring something similar to the byte distance.

=== Biases

The built in survivorship bias is included with this metric for better or for worse. Alternative algorithms were tested during the project, but did not show promise and were abandoned early on.

= Conclusion & Future Work

== Summary of Key Contributions
// Recap: definition of Compression Distance (CD) metric
// Recap: implementation in Git Truck API and empirical evaluation
// Recap: CD's advantages over LoCC demonstrated via RQ1-RQ3

This paper has presented a method for using compression as a metric for information distance, defined as

$ "CD"(x,y) = |C(x)| - |C(x #sym.union y)| $

where $C$ is a compression function, $x$ is the concatenated commit buffer and $y$ is the baseline concatenated commit buffer.


The results suggest that CD provides a more nuanced and robust measure of software evolution, paving the way for its adoption in both academic research and industry practice. The results also show that you need to be aware of built in biases in the metric.

== Future Work

There are many directions to take this project further, including exploring usability, scalability, performance and bias elimination.

=== Usability

Incorporating the tool into Git Truck would make it so others could experiment with the data as well. It would also be interesting to see how this data could be incorporated and presented into the visualizations of Git Truck. It could work as an extension of the author distribution already found in Git Truck, that is currently based on LoCC.

=== Scalability

Attempting to run the tool on a large repository, like the source code for Linux @torvalds69:online yields a maxBuffer exceeded error:

```
RangeError: stdout maxBuffer length exceeded
    at Socket.onChildStdout (node:child_process:481:14)
    at Socket.emit (node:events:507:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Socket.Readable.push (node:internal/streams/readable:390:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:23) {
  code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
  cmd: 'git ls-tree -r HEAD'
```

This shows that future work could be done to investigate whether this metric could scale to very large repositories.

=== Performance

Future work could be done to investigate methods of speeding up the computational process. The process might be parallelizable and could utilize using shared memory with dynamic garbage collection, to reduce the memory overhead of the analysis. The current approach caches file buffers, but leaves garbage collection to the runtime.

=== Bias elimination

Attempting to design an algorithmic formula for avoiding the survivorship bias included in the metric might be an interesting project to undertake, if the bias is deemed undesirable to the use case.

= Acknowledgments

The git analysis pipeline powering Git Truck was used as a foundation for developing the analysis tool.

We would like to thank Christian Gram Kalhauge \<chrg\@dtu.dk\> for proposing the idea for this project and for his valuable external supervision and guidance.
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

```javascript
while (workingOnThisProject) {
  Jonas.becameAFather();
}
```

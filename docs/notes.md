# Complexity Distance

$|.|$ denotes the compressed size.

$A$ and $B$ is a file, $R$ is the rest of the repository.

$AB$ denotes to concat $A$ with $B$.

Say you want to figure out how complex file $A$ is compared the rest of the repository $R$, you can compute the Normalized Compression Distance for $A$ as follows:
n $${NCD}_A=\frac{|AR| - |A|}{|R|}$$

If $A$ is easier to compress when knowing $R$, then $|AR| < |A| + |R|$ or $\frac{|AR| - |A|}{|R|} < 1$ but if there is no compression then $\frac{|AR| - |A|}{|R|} = 1$.

## Experiment 1

1. compute NCD
2. compare the results, and
3. what are the limitations? how big of a project can be analyzed?
4. compare across gzip and zstd compression algorithms, the time it takes to compute each for various projects with different sizes.

- [ ] Compute NCD
  - Read all files in the directory
  - Compress $R$, $A$ and $AR$
  - $R$ is the concatenation of all files except $A$
  - $A$ is the file you want to compute the NCD for
  - $AR$ is the concatenation of $A$ and $R$ (the entire repository)

## Experiment 2

1. Compute NCD for commits (how much complexity does this commit add to the repository)

## Experiment 3

1. Make the computation faster using streams and workers.

## Experiment 4

Computing NCD might be slow to compute, therefore I propose a proxy:

$${NCD}_A\approx\frac{|AR| - |A|}{|AR|}$$

My hypothesis is that this will be similar to the NCD, but faster to compute, since we only need to compress $A$ and $R$ and not $R$, which might be different for each file. The problem with this approach is that the complexity of $A$ is already embedded in the compression of $AR$, so we might not get a good estimate of the complexity of $A$.

1. compute both NCD and the approximation,
2. compare the results, and
3. compare the time it takes to compute each for various projects with different sizes.
4. compare across gzip and zstd compression algorithms.
5. what are the limitations

- Ignore uninteresting files, such as `package-lock.json` etc. or only focus on specific file extensions, or a specific file

## Meeting

- [ ] ## How much do I write in the report?
-

## Experiment with pairwise NCD

$$
NCD_A = \frac{|AB| - \min(|A|, |B|)}{\max(|A|, |B|)}
$$

https://docs.google.com/spreadsheets/d/1e0tJ4RbjhQDNtrmz0V0GZrwKZ1rmo8k5m77CXuiTnsU/edit?gid=1368586681#gid=1368586681

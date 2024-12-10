# Complexity Distance

$|.|$ denotes the compressed size.

$A$ and $B$ is a file, $R$ is the rest of the repository.

$AB$ denotes to concat $A$ with $B$.

Say you want to figure out how complex file $A$ is compared the rest of the repository $R$, you can compute the Normalized Compression Ratio for $A$ as follows:
n $${NCR}_A=\frac{|AR| - |A|}{|R|}$$

If $A$ is easier to compress when knowing $R$, then $|AR| < |A| + |R|$ or $\frac{|AR| - |A|}{|R|} < 1$ but if there is no compression the $\frac{|AR| - |A|}{ / |R| = 1}$.

## Experiment 1
1) compute NCR
2) compare the results, and
5) what are the limitations? how big of a project can be analyzed?
6) compare across gzip and zstd compression algorithms, the time it takes to compute each for various projects with different sizes.

- [ ] Compute NCR
  - Read all files in the directory
  - Compress $R$, $A$ and $AR$
  - $R$ is the concatenation of all files except $A$
  - $A$ is the file you want to compute the NCR for
  - $AR$ is the concatenation of $A$ and $R$ (the entire repository)

## Experiment 2

1. Make the computation faster using streams and workers.


## Experiment 3

Computing NCR might be slow to compute, therefore I propose a proxy:

$${NCR}_A\approx\frac{|AR| - |A|}{|AR|}$$

My hypothesis is that this will be similar to the NCR, but faster to compute, since we only need to compress $A$ and $R$ and not $R$, which might be different for each file. The problem with this approach is that the complexity of $A$ is already embedded in the compression of $AR$, so we might not get a good estimate of the complexity of $A$.


1) compute both NCR and the approximation,
2) compare the results, and
3) compare the time it takes to compute each for various projects with different sizes.
4) compare across gzip and zstd compression algorithms.
5) what are the limitations



  - Ignore uninteresting files, such as `package-lock.json` etc. or only focus on specific file extensions, or a specific file

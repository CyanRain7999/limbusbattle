"""Find the dense body column, excluding long, thin weapons from the root anchor.

This only translates existing RGBA art. It never resizes heads or repaints pixels.
"""
from collections import Counter


def body_column(pixels, width):
    xs = Counter(p % width for p in pixels)
    ys = [p // width for p in pixels]
    radius = max(6, round((max(ys)-min(ys)+1)*.05))
    prefix = [0]
    for x in range(width):
        prefix.append(prefix[-1]+xs[x])
    scores = [prefix[min(width,x+radius+1)]-prefix[max(0,x-radius)] for x in range(width)]
    peak = max(range(width),key=lambda x:scores[x])
    cutoff = scores[peak]*.92
    left = right = peak
    while left>0 and scores[left-1]>=cutoff:left-=1
    while right<width-1 and scores[right+1]>=cutoff:right+=1
    return round((left+right)/2)

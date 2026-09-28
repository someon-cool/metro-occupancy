# edge/src/counter.py
from collections import deque
from statistics import median

class OccupancyCounter:
    def __init__(self, capacity, window=15):
        self.capacity, self.buf = capacity, deque(maxlen=window)

    def update(self, count):
        self.buf.append(count)
        smoothed = int(median(self.buf))
        return smoothed, round(100 * smoothed / self.capacity, 1)
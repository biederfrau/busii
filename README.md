# BUSIIvis

This is the repository for Business Intelligence 2 winter semester 2018.

Our objective was to implement a tool that could be used like something akin
to a debugger for the machining process data. It should be possible to step
through time and see which tools were used when, where the tool was in space,
and the readings of the various sensors (e.g. load, torque).

Further, it should be possible to label sections of time where something unusual
happened, and these labels should be able to be exported for later use with e.g.
ML algorithms or other analysis tools.

## Description of Views

<p align="center">
  <img src="https://github.com/biederfrau/busii/blob/master/ass/final/img/screen-labeled.png" />
  <br/>
  Figure 1: High-fidelity prototype and final product
  <br/>
  <img src="https://github.com/biederfrau/busii/blob/master/ass/final/img/label-dialog.png" />
  <img src="https://github.com/biederfrau/busii/blob/master/ass/final/img/settings.png" />
  </br>
  Figure 2: Labelling dialog and settings
</p>

The most important views as far as interactivity is concerned are the
activities chart (marked D in Figure 1) and the stepping
controls directly below it, as well as the selection and settings dialog which
can be opened by clicking the buttons at the bottom right.

The activities chart displays the time segments in which machining data was
recorded without interruptions of more than 15 seconds. It can be clicked to
update the current time step, or the vertical bar can be dragged to scan along
the time axis and update all views correspondingly. If multiple charts are selected,
they will be displayed one below the other.

The stepping controls below allow to jump to the start or the end of the
recorded events as well as (dis)enabling the automatic stepping. One single
manual step can also be taken. By default, the stepsize is calculated as
$\frac{\text{length of process}}{100}$, i.e. a process is divided into 100
steps. This can be adjusted in the settings.

The 3D scatterplot (marked B) displays the locations of the tools during the
process. The data is processed into 600 microclusters by using $k$-means to
deal with the high volume of points in some processes. Unfortunately, SVG does
not scale to thousands of elements. If more than one process are selected, the
primary process will be shown in blue and the secondary proceses in red, and
the secondary points will disappear after a predefined amount of time (by
default 10 seconds). The microclusters appear as soon as the earliest point
summarized by the cluster would have appeared.

View C shows timeseries data for the X, Y and Z axes (ordered from top to bottom).
They are not preprocessed. It might be a good idea to apply PAA (piecewise aggregate
approximation) to cut down on the number of points. Data points that would only appear
after the current timestep are hidden behind a white overlay.

A brush over the time axis can be triggered by clicking on one of the 9
timeseries charts. Right-clicking on the brush opens a dialog allowing to label
the selected segment, see Figure 2.

Finally, view A displays miscellaneous data, like the identifiers of the tools
used, their length and radius, and the feedrate override. Similar to the
timeseries view, data occuring after the current timestep are hidden behind a
white overlay. The bars of the tool identifier chart can be used to filter the
scatterplot below to display only points made by certain tools.

If multiple processes are selected, the buttons on the top right of the tool
identifier chart can be used to toggle between the processes for that chart.
The button for the primary process is green to distinguish it from the others
and to offer a visual cue as to which process is currently selected as the
primary.

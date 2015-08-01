
Plottyjs plots functions in your HTML with d3js.

It is not meant to become interactive or fully featured, it was written to
embed plots in documentation, blogs, etc.

See the [example page](http://htmlpreview.github.io/?https://github.com/yohcop/plottyjs/blob/master/example.html)

# Documentation

## Using javascript

Using javascript, a svg element is appended right after the `script` tag.

Single parametric plot:

```
<script>
  var plot = plottyjs.newPlot(300, 300, {
    xbounds: [-1.2, 1.2],
    ybounds: [-1.2, 1.2],
    t: [0, 2*Math.PI],
    samples: 300
  });
  plot.parametric('sin(2*t)', 'sin(3*t)');
</script>
```

Multiple plots:

```
<script>
  var plot = plottyjs.newPlot(400, 200, {
    t: [-5, 5],
    ybounds: [-2.5, 2.5],
    samples: 300
  });
  plot.cartesian('sin(x)').style('stroke', 'lightblue');
  plot.cartesian('4 / (1 + exp(-x))-2');
  plot.cartesian('sqrt(x)').style('stroke', 'lightgreen');
  plot.cartesian('tan(x)+0.5').style('stroke', 'lightcoral');
  plot.cartesian('1/x').style('stroke', 'lightslategray');
  plot.cartesian('1/(x-pi)+0.5').style('stroke', 'lightslategray');
  plot.cartesian('x^2').style('stroke', 'lightpink');
</script>
```

Parameters to the newPlot function are the width and height of the svg element
to be created, followed by options.

Options are:

- `t` defines the range of sampling, defaults to [-1, 1],
- `samples` defines how many samples ar taken in the range `t` and defaults to 100,
- `xbounds` for boundaries of the `x` axis, defaults to automatically finding
  the bounds. If they are automatically determined and multiple equations are
  plotted, `xbounds` is determined from the first one plotted only.
- `ybounds` is the same for the `y` axis.
- `margin` adds a margin to the svg element and defaults to 2 (it looks nicer
  if this matches the stroke-width used in the plot.)

## Using HTML tags

Using HTML tags, an svg element is added as a child of the element.

```
<span class="plot" id="asym" data-y="1/(x-pi)"
      data-from="-3" data-to="6"
      data-bottom="-15" data-top="15"
      data-width="300" data-height="100"></span>
```
Once the document is loaded, run the following function once, will process
every plot on the page with a `plot` class for example:

```
plottyjs.makePlots(document.querySelectorAll('.plot'));
```

Data attributes correspond to Options above:

- `from` and `to` are set to `t`
- `left`, `right` map to `xbouds`, while `bottom` and `top` map to `ybounds`
- `samples` and `margin` are obvious

Then, two extra data attributes are available: `width` and `height`. They
define the svg size and are required.

Finally data attributes `x`, `y` and `r` define the function to render, and at
least some combination of them must be specified:

- if both `x` and `y` are specified, a parametric equations is rendered with
  `x=f(t)` and `y=f(t)` (i.e. use `t` as variable name in the function),
- if `r` is defined then a polar equation is rendered with `r=f(o)`,
- Otherwise `x` must define a cartesian equation as `y=f(x)`

Another example:

```
<span class="plot" id="polar2" data-r="sin(o)+(sin(5*o/2))^3"
      data-from="0" data-to="12.5663706144"
      data-samples="300"
      data-width="200" data-height="200"></span>
```

By leaving out `left`, `right`, `top` and `bottom` the bounds are automatically
computed and the plot fills the whole svg. In that situation, care must be
taken with the selection of `width` and  `height`.


## Writing functions

When specifying functions as parameters to the `cartesian`, `parametric` or
`polar` functions, you can use either a string or a javascript function.

When specifying functions in the `data-x`, `data-y` or `data-r` html
attributes, only strings can be used.

Strings are parsed using Math.js.

# Dependencies

- [Math.js](http://mathjs.org)
- [D3.js](http://d3js.org/)

For CDN hosted versions:
```
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/2.0.1/math.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
```

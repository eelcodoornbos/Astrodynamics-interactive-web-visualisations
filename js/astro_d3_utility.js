function anglesToArcPath(xScale,yScale,x,y,radius,startangle,endangle,flipsweep,fliplargearc)
{
    var x1, x2, y1, y2, sweep, xrotation, largearc;
    x1 = xScale(x + radius * Math.cos(startangle));
    y1 = yScale(y + radius * Math.sin(startangle));
    x2 = xScale(x + radius * Math.cos(endangle));
    y2 = yScale(y + radius * Math.sin(endangle));
    xrotation = Math.PI/2;
    xrotation = 0;
    if (fliplargearc == 0) {
        endangle - startangle > Math.PI ? largearc = 1 : largearc = 0;
    } else {
        endangle - startangle < Math.PI ? largearc = 1 : largearc = 0;
    }
    if (flipsweep == 0) {
        endangle < startangle ? sweep = 1 : sweep = 0;
    } else {
        endangle > startangle ? sweep = 1 : sweep = 0;        
    }
    var xradius = xScale(radius)-xScale(0);
    var yradius = yScale(radius)-yScale(0);
    var d = "M" + x1 + "," + y1 + "A" + xradius + "," + yradius + " " + xrotation + " " + largearc + " " + sweep + " " + x2 + "," + y2;
    return d;
}

function anglesToClosedArcPath(xScale,yScale,x,y,radius,startangle,endangle,flipsweep,fliplargearc)
{
    var x1, x2, y1, y2, sweep, xrotation, largearc;
    x1 = xScale(x + radius * Math.cos(startangle));
    y1 = yScale(y + radius * Math.sin(startangle));
    x2 = xScale(x + radius * Math.cos(endangle));
    y2 = yScale(y + radius * Math.sin(endangle));
    xrotation = 0;
    if (fliplargearc == 0) {
        endangle - startangle > Math.PI ? largearc = 1 : largearc = 0;
    } else {
        endangle - startangle < Math.PI ? largearc = 1 : largearc = 0;
    }
    if (flipsweep == 0) {
        endangle < startangle ? sweep = 1 : sweep = 0;
    } else {
        endangle > startangle ? sweep = 1 : sweep = 0;        
    }
    var xradius = xScale(radius)-xScale(0);
    var yradius = yScale(radius)-yScale(0);
    var d = "M" + xScale(x) + "," + yScale(y) + " L" + x1 + "," + y1 + " " + "L" + x1 + "," + y1 + "A" + xradius + "," + yradius + " " + xrotation + " " + largearc + " " + sweep + " " + x2 + "," + y2 + " " + "Z";
    return d;
}

// Markers for arrowheads
function addArrowMarker(config) {
    var arrowPath = "M 0 0 " + config.arrowLength + " "+ config.arrowWidth  / 2 + " 0 "+ config.arrowWidth +" Z";
    config.element.append("marker")
        .attr("id",config.id)
        .attr("markerWidth",config.arrowLength)
        .attr("markerHeight",config.arrowWidth)
        .attr("refX",config.arrowLength)
        .attr("refY",config.arrowWidth/2)
        .attr("orient","auto")
        .append("path")
            .attr("d",arrowPath); 
}

function scaleArrowStyle(element,length,defaultArrowLength,defaultVectorStrokeWidth) {
    // Scales down the linewidth of a vector 
    // if the length is shorter than the length of the arrowhead.
    var linewidth;
    if (Math.abs(length) < defaultArrowLength * defaultVectorStrokeWidth)
    {
        linewidth = Math.abs(length) / (defaultArrowLength) + "px";
    } 
    else 
    {
        linewidth = defaultVectorStrokeWidth + "px";
    }
    element.style("stroke-width",linewidth);
}

gridLines = function() {
    var orient = "horizontal",
        xScale = d3.scale.linear(),
        yScale = d3.scale.linear(),
        ticks = 5;
        
    function grid(g) {
        g.each(function() {
            var g = d3.select(this);
            if (orient === "horizontal") {
                var gridLines = g.selectAll("line.horizontalGrid").data(yScale.ticks(ticks));
                gridLines.enter().append("line").attr("class","horizontalGrid");
                gridLines
                    .attr("x1", function(d) { return xScale.range()[0] } )
                    .attr("x2", function(d) { return xScale.range()[1] } )
                    .attr("y1", function(d) { return yScale(d) })
                    .attr("y2", function(d) { return yScale(d) });
                gridLines.exit().remove();
            } else {
                var gridLines = g.selectAll("line.verticalGrid").data(xScale.ticks(ticks));
                gridLines.enter().append("line").attr("class","verticalGrid");
                gridLines
                    .attr("x1", function(d) { return xScale(d); } )
                    .attr("x2", function(d) { return xScale(d); } )
                    .attr("y1", function(d) { return yScale.range()[0]; })
                    .attr("y2", function(d) { return yScale.range()[1]; });
                gridLines.exit().remove();                
            }
        });
    }

    grid.xScale = function(x) {
        if (!arguments.length) return xScale;
        xScale = x;
        return grid;
    };

    grid.yScale = function(x) {
        if (!arguments.length) return yScale;
        yScale = x;
        return grid;
    };

    grid.orient = function(x) {
        if (!arguments.length) return orient;
        orient = x;
        return grid;
    };
    
    grid.ticks = function(x) {
        if (!arguments.length) return ticks;
        ticks = x;
        return grid;
    };
    
    grid.tickValues = function(x) {
        if (!arguments.length) return tickValues;
        tickValues = x;
        return grid;
    };

    return grid;

}

function sign(x){return x>0?1:x<0?-1:x;}
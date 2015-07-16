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

function sign(x){return x>0?1:x<0?-1:x;}
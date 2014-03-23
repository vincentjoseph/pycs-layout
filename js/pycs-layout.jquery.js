/*
Thanks Johannes Treitz for this one.
http://www.crispymtn.com/stories/the-algorithm-for-a-perfectly-balanced-photo-gallery
   
This algorithm reorganises the photo to optimize the distribution
of the pictures inside the container.
*/

(function($) {

    $.fn.pycsLayout = function(options) {

	var settings = $.extend({
	    pictureContainer: ".picture",
	    idealHeight: 150,
	    gutter: 6,
        }, options);
		
	var chromatic = function(containerWidth, items){

	    var zero_tab = function(n, k){
		/* intialise the array with zero */
		var table = [];
		for(var i=0; i<n; i++){
		    table[i] = [];
		    for(var j=0; j<k; j++){
			table[i][j] = 0;
		    }
		}
		return table;
	    };
	    
	    var linear_partition = function(seq, k){
		n = seq.length;

		if(k <= 0){
		    return [];
		}
		if(k > n){
		    return seq.map(function(x){
			return [x];
		    });
		}

		var table = zero_tab(n, k);
		var solution = zero_tab(n, k);

		/* build the partition tables */
		for(var i=0; i<n; i++){
		    table[i][0] = seq[i];
		    if(i>0){
			table[i][0] += table[i-1][0];
		    }
		}
		for(var j=0; j<k; j++){
		    table[0][j] = seq[0];
		}

		for(var i=1; i<n; i++){
		    for(var j=1; j<k; j++){
			var m = [Math.max(table[0][j-1], 
					  table[i][0] - table[0][0])];
			m.push(0);
			for(var x=0; x<i; x++){
			    var max=Math.max(table[x][j-1], 
					     table[i][0] - table[x][0]);
			    if(max < m[0]){
				m = [max, x];
			    }
			}
			table[i][j] = m[0];
			solution[i-1][j-1] = m[1];
		    }
		}

		n = n-1;
		k = k-2;
		ans = [];
		while(k >= 0){
		    var p = [];
		    if(n>0){
			for(var i=solution[n-1][k]+1; i<n+1; i++){
			    p.push(seq[i]);
			}
		    
			ans = [p].concat(ans);
			n = solution[n-1][k];
		    }
		    k = k-1;
		}
		var p = [];
		for(var i=0; i<n+1; i++){
		    p.push(seq[i]);
		}
		return [p].concat(ans);
	    }
	    
	    /* 
	       Compute aspect ratios for each picture and store it as an 
	       attribute.
	       It also compute the width of the picture after reducing its height to
	       idealHeight.
	     */
	    var get_aspect_ratios = function(items){
		aspect_ratios = [];
		for(var i=0; i<items.length; i++){
		    var width = parseInt($(items[i]).attr("data-pycs-width"));
		    var height = parseInt($(items[i]).attr("data-pycs-height"));
		    var ar = width/height;
		    var new_width = ar * settings.idealHeight;
		    $(items[i]).attr("data-pycs-vwidth", new_width);
		    $(items[i]).attr("data-pycs-vheight", settings.idealHeight);
		    $(items[i]).attr("data-pycs-aspect-ratio", ar);
		    aspect_ratios.push(parseInt(ar*100));
		}
		return aspect_ratios;
	    }

	    var totalWidth = 0;
	    var weights = get_aspect_ratios(items);
	    var rows_number = 0;
	    var rows = [];

	    for(var i=0; i<items.length; i++){
		totalWidth += (parseInt($(items[i]).attr("data-pycs-vwidth")) + 
			       settings.gutter);
	    }
	    
	    rows_number = Math.round(totalWidth / containerWidth);

	    partition = linear_partition(weights, rows_number);

	    /* build the rows and resize the images */
	    var index = 0;
	    for(var i=0; i<partition.length; i++){
		rows[i] = [];		    
		var summed_ratios = 0;
		for(var j=0; j<partition[i].length; j++){
		    summed_ratios += parseFloat($(items[index]).attr("data-pycs-aspect-ratio"));
		    rows[i][j] = items[index];
		    index++;
		}
		for(var j=0; j<rows[i].length; j++){
		    var vwidth = containerWidth / summed_ratios;
		    vwidth *= parseFloat($(rows[i][j]).attr("data-pycs-aspect-ratio"));
		    vwidth = parseInt(vwidth) - (settings.gutter);
		    var vheight = parseInt(((containerWidth-rows[i].length*settings.gutter) / summed_ratios));
		    $(rows[i][j]).attr("data-pycs-vwidth", vwidth);
		    $(rows[i][j]).attr("data-pycs-vheight", vheight);
		}
	    }
	    
	    return rows;
	}

	var showImages = function(imageContainer, realItems) {

	    // reduce width by 1px due to layout problem in IE
	    var containerWidth = imageContainer.width() - 1;
	    // Make a copy of the array
	    var items = $.extend(true, [], realItems);
	    var rows = null;
	    
	    // we keep the original sizes so we can deal with the reisze event
	    if(imageContainer.attr("data-pycs-done") != "true"){
		for(var i=0; i<items.length; i++){
		    var width = parseInt($(items[i]).width());
		    var height = parseInt($(items[i]).height());
		    $(items[i]).attr("data-pycs-width", width);
		    $(items[i]).attr("data-pycs-height", height);
		}
	    }

	    rows = chromatic(containerWidth, items);
	   
	    for(var r in rows) {
	    	for(var i in rows[r]) {		    
	    	    var item = rows[r][i];		    
		    $(item).css({
			"margin": parseInt(settings.gutter/2) + "px",
			"float": "left",
			"position": "relative",
			"width": $(item).attr("data-pycs-vwidth") + "px",
			"height": $(item).attr("data-pycs-vheight") + "px",
			"opacity": 1
			//"display": "inline-block"
		    });
		     $('img', item).css({
		     	 "width": $(item).attr("data-pycs-vwidth") + "px",
		     	 "height": $(item).attr("data-pycs-vheight") + "px",	
		     	 "margin-top": "0px",
		     });		    
		    imageContainer.append($(item));
		}		
	    }
	    imageContainer.attr("data-pycs-done", "true");
	};

	var $this = $(this);

	if($(this).length > 0){
	    $(this).each(function(){
		showImages($(this), $(settings.pictureContainer, $(this)));
	    });

	    /* let 100ms before recalculate everything on resizing */
	    var doit;
	    window.onresize = function(){
		clearTimeout(doit);
		doit = setTimeout(function(){
		    $this.each(function(){
			showImages(
			    $(this), 
			    $(settings.pictureContainer, $(this))
			);
		    });
		}, 100);
	    }
	}
	return $this;
    };

}(jQuery));

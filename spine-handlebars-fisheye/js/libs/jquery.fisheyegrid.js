/*!
 * jQuery Fisheye Grid version 0.01
 * Copyright 2011, Adam Laughlin
 * http://a-laughlin.com
 * Licensed under MIT & GPL version 2
 * http://static.a-laughlin.com/mit_license.txt
 * http://static.a-laughlin.com/gpl_license.txt
 */

/*
 * Function fisheyeGrid - Calculates incremental sizes of divs within
 * a the fisheye grid and writes the values to a style element.
 * Animation increments the container id instead of individual
 * elements' style attributes
 * grid1 .fisheye-cell {height:n;width:n;}
 * grid2 .fisheye-cell {height:n+1;width:n+1;}
 * grid3 .fisheye-cell {height:n+2;width:n+2;}
 * 
 * Param optionsObj: {}
 * 
 * Example: $('#foo').fisheyeGrid() // running with defaults
 * Example: $('#foo').fisheyeGrid({steps:10,speed:20}); // adjusting iteration steps and speed
 * 
 * etc.
 */

(function ($) {
	$.fn.fisheyeGrid=function(optionsObj){
		return this.each(function(){
			if(optionsObj!==undefined && !$.isPlainObject(optionsObj)) throw 'fisheyeGrid only accepts object literal arguments and undefined' 
			
			var el=this,
			$el=$(el),
			defaults={
				minWidth:40,// minimum width of one cell
				minHeight:30, // minimum height of one cell
				steps:15, // number of steps to iterate through
				speed:15, //ms
				width:$el.width(), // ignores padding/margins/borders currently - to use them, manually set this as wide as it needs to be to offset the width/height they add 
				height:$el.height(), // same as the last line
				cellClass:'fisheye-cell', // the class set on cells
				rowClass:'fisheye-row', // the class set on rows
				dataName:'cells', // the name of the $().data() property to store cell info in
				events:'click' // default event to trigger resizes 
			},
			opts=$.extend({},defaults,optionsObj),
			cellClass=opts.cellClass,
			cellClassSelector = '.' + cellClass,
			rowClass=opts.rowClass,
			rowClassSelector='.'+rowClass,
			cellDataName=opts.dataName,
			elId=el.id,
			gridClass= elId,
			gridSelector='.'+gridClass,
			stepsArray=[],
			stepCount=opts.steps+1,
			maxStep=stepCount-1,
			initialStep=gridClass+'0';
			
			
			// define private functions
			function init (){ // initialize the grid
				$el.addClass(gridClass); // add a stable grid class for styling 
				for(var i=0;i<stepCount;i++) { // add the ids to iterate to an array
					stepsArray.push(gridClass+i); // get the ids to iterate throughwhen animating
				}
				setStep(initialStep); // set the grid to the initial step
				
				var style=new Stylesheet(), // create a new stylesheet object
				animation=new Animator(), // and an animation object
				$styleElem=$('<style type="text/css" class="fisheye-style"/>'), // and a style element to contain the grid styles
				$rows=$el.children().addClass(rowClass), // add row classes
				colCells=[]; // stores each grid column's jQuery collection 
				$styleElem.text( style.getText() ).appendTo('head');
				
				$rows.each(function(){
					var $rowCells = $(this).children();
					$rowCells.each(function(colNum){
						if(!colCells[colNum]) colCells[colNum] = $rows.find('> :eq('+colNum+')');
						$(this).addClass(cellClass).data(cellDataName,{row:$rowCells,col:colCells[colNum]});
					});
				});
				
				animation.init(); // initialize animation
			}
			
			function setStep (prop){
				el.id=prop;
			}
			
			//define submodules
			function Stylesheet (){
				function calcFisheyeStepVals(step,count,incrementSize,origVal,containerSize,numInactive,transIncrement,maxActiveSize,minInactiveSize){
					var activeGrowingSize = Math.round((incrementSize*step)+origVal),
					allInactiveSize = containerSize-activeGrowingSize,
					leftovers = allInactiveSize%numInactive,
					inactiveSize = (allInactiveSize-leftovers)/numInactive,
					transGrowingSize=Math.round((transIncrement*step)+minInactiveSize),
					transShrinkingSize=maxActiveSize-transGrowingSize+minInactiveSize;
					activeGrowingSize += leftovers;
					return {
						inactive:inactiveSize,
						activeGrowing:activeGrowingSize,
						transActiveGrowing:transGrowingSize,
						transActiveShrinking:transShrinkingSize
					}
				};
	
				function getText(){ // returns the text for a fisheye grid <style> element
					var gridWidth=opts.width,
					gridHeight=opts.height,
					$rows=$el.children(),
					rowCount=$rows.length,
					colCount=$rows.filter(':first').children().length,
					cellWidth=Math.round(gridWidth/colCount),
					cellHeight=Math.round(gridHeight/rowCount),
					inactiveCols=colCount-1,
					inactiveRows=rowCount-1,
					allInactiveColsWidth=inactiveCols*opts.minWidth,
					allInactiveRowsHeight=inactiveRows*opts.minHeight,
					maxActiveWidth=gridWidth-allInactiveColsWidth,
					maxActiveHeight=gridHeight-allInactiveRowsHeight,
					widthIncrement=(gridWidth-cellWidth-allInactiveColsWidth)/(stepCount-1),
					heightIncrement=(gridHeight-cellHeight-allInactiveRowsHeight)/(stepCount-1),
					transWidthIncrement=((maxActiveWidth-opts.minWidth)/(stepCount-1)),
					transHeightIncrement=(maxActiveHeight-opts.minHeight)/(stepCount-1),
					prefix,
					curWidth,
					curHeight,
					L=stepCount,
					growingInactives='',
					shrinkingInactives='',
					rowGrowing='',
					rowShrinking='',
					colGrowing='',
					colShrinking='',
					expandedInactives='',
					expandedRowGrowing='',
					expandedRowShrinking='',
					expandedColGrowing='',
					expandedColShrinking='';
					
					for(var i=0;i<stepCount;i++){
						curWidth= calcFisheyeStepVals(i,stepCount,widthIncrement,cellWidth,gridWidth,inactiveCols,transWidthIncrement,maxActiveWidth,opts.minWidth);
						curHeight= calcFisheyeStepVals(i,stepCount,heightIncrement,cellHeight,gridHeight,inactiveRows,transHeightIncrement,maxActiveHeight,opts.minHeight);
						prefix='#'+elId + i;
						growingInactives+= (prefix+' '+cellClassSelector+' {width:'+curWidth.inactive+'px;height:' + curHeight.inactive+'px;}\n');
						rowGrowing+= (prefix+ ' .activeRowGrowing {height:' + curHeight.activeGrowing+'px;}\n');
						colGrowing+=(prefix+ ' .activeColGrowing {width:' + curWidth.activeGrowing+'px;}\n');
						shrinkingInactives+= ('#'+elId + (--L) +'.shrink '+cellClassSelector+'  {width:'+curWidth.inactive+'px;height:' + curHeight.inactive+'px;}\n');
						rowShrinking+=('#'+elId + (L) +'.shrink .activeRowShrinking {height:' + curHeight.activeGrowing +'px;}\n');
						colShrinking+=('#'+elId + (L) +'.shrink .activeColShrinking {width:' + curWidth.activeGrowing +'px;}\n');
						prefix=prefix+'.expanded';
						expandedInactives+=(prefix+' '+cellClassSelector+' {width:'+opts.minWidth+'px;height:' + opts.minHeight+'px;}\n');
						expandedRowGrowing+=(prefix+' .activeRowGrowing {height:'+curHeight.transActiveGrowing+'px;}\n');
						expandedRowShrinking+=(prefix+' .activeRowShrinking {height:'+curHeight.transActiveShrinking+'px;}\n');
						expandedColGrowing+=(prefix+' .activeColGrowing {width:'+curWidth.transActiveGrowing+'px;}\n');
						expandedColShrinking+=(prefix+' .activeColShrinking {width:'+curWidth.transActiveShrinking+'px;}\n');
					}
					
					return [
		        growingInactives,rowGrowing,colGrowing,shrinkingInactives,rowShrinking,colShrinking,expandedInactives,expandedRowGrowing,expandedRowShrinking,expandedColGrowing,expandedColShrinking,
		        '#'+gridClass+'0 '+ cellClassSelector+'{width:'+cellWidth+'px;height:'+cellHeight+'px;}',
		        gridSelector+ ' .maxWidthLock {width:'+maxActiveWidth+'px !important}',
		        gridSelector+ ' .maxHeightLock {height:'+maxActiveHeight+'px !important}'
	        ].join('\n\n');
					
				};
				return {getText:getText};
			};
	
			function Animator(){
				var moving,$prevActiveRow,$prevActiveCol,$cell,data,$activeCol,$activeRow,$all,isActiveRow,isActiveCol,isExpanded,step,
				maxHeightLock='maxHeightLock',
				maxWidthLock='maxWidthLock',
				activeRowShrinking='activeRowShrinking',
				activeColShrinking='activeColShrinking',
				activeRowGrowing='activeRowGrowing',
				activeColGrowing='activeColGrowing',
				activeTransRowShrinking='activeTransRowShrinking',
				activeTransColShrinking='activeTransColShrinking',
				activeTransRowGrowing='activeTransRowGrowing',
				activeTransColGrowing='activeTransColGrowing',
				expandedClass='expanded',
				shrinkClass='shrink';
	
	
				function animate (callbackFn){
					if(moving) return;
					var i=0,
					argums=arguments;
					(function iterateSteps(){
						step=stepsArray[i++];
						if(step){
							moving=true;
							setStep(step);
							step;
							setTimeout(iterateSteps,opts.speed);
						} else {
							moving=false;
							$.each(argums,function(){
								this();
							});
							setStep(initialStep);
							$prevActiveCol=$activeCol;
							$prevActiveRow=$activeRow;
						}
					})();
				};
				
				function set(){
					$el.delegate(cellClassSelector,opts.events,function(){
						$cell=$(this);
						data=$cell.data(cellDataName);
						$activeCol=data.col;
						$activeRow=data.row;
						$all=data.all;
						isActiveRow=$cell.hasClass(maxHeightLock);
						isActiveCol=$cell.hasClass(maxWidthLock);
						isExpanded=$el.hasClass(expandedClass);
						function lockCol(){
							$prevActiveCol.removeClass(activeColShrinking);
							$activeCol.toggleClass([maxWidthLock,activeColGrowing,activeColShrinking].join(' '));
						}
						function lockRow(){
							$prevActiveRow.removeClass(activeRowShrinking);
							$activeRow.toggleClass([maxHeightLock,activeRowGrowing,activeRowShrinking].join(' '));
						}
						
						
						if(isActiveRow&&isActiveCol) { // clicked on active cell. Collapse grid;
							
							$el.addClass(shrinkClass);
							$activeRow.addClass(activeRowShrinking);
							$activeCol.addClass(activeColShrinking);
							$el.removeClass(expandedClass);
							$activeRow.removeClass(maxHeightLock);
							$activeCol.removeClass(maxWidthLock);
							animate(function(){
								$activeRow.removeClass(activeRowShrinking);
								$activeCol.removeClass(activeColShrinking);
								$el.removeClass(shrinkClass);
							});
						}
						
						else if(isActiveRow) {// same row.  transition only the columns
							$prevActiveCol.removeClass(maxWidthLock);
							$activeCol.addClass(activeColGrowing);
							animate(lockCol);
						}
						else if (isActiveCol) { // same column. transition only the rows
							$prevActiveRow.removeClass(maxHeightLock);
							$activeRow.addClass(activeRowGrowing);
							animate(lockRow);
						}
						else if(isExpanded){ // expanded grid. new cell.  Transition col and row. 
							$prevActiveCol.removeClass(maxWidthLock);
							$prevActiveRow.removeClass(maxHeightLock);
							$activeCol.addClass(activeColGrowing);
							$activeRow.addClass(activeRowGrowing);
							animate(lockRow,lockCol);
						} else {
							// inactive grid.  New cell. // Expand grid;
							$activeRow.addClass(activeRowGrowing);
							$activeCol.addClass(activeColGrowing);
							animate(function(){
								$activeRow.toggleClass([maxHeightLock,activeRowGrowing,activeRowShrinking].join(' '));
								$activeCol.toggleClass([maxWidthLock,activeColGrowing,activeColShrinking].join(' '));
								$el.addClass(expandedClass);
								return true;
							});
							
						}
					});
				}
				return {init:set};
			};
			init();
		})
	}
})(jQuery);
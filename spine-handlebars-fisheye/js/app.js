$(function(){
  
  // MODELS
  Character = Spine.Model.sub({});
  Character.configure('Character','name','example','hasColor');
  
  var Symbol=Character.sub(), // subclass Character
  Numbr=Character.sub(),
  Letter=Character.sub();
  Symbol.configure('Symbol'); // configure subclasses
  Numbr.configure('Numbr');
  Letter.configure('Letter');
  Symbol.extend(Spine.Model.Local); // enable local storage persistence
  Numbr.extend(Spine.Model.Local);
  Letter.extend(Spine.Model.Local);
  Symbol.fetch() // get the models from local storage if there
  Numbr.fetch()
  Letter.fetch()

  // CONTROLLERS
  var GridController = Spine.Controller.sub({
    template:Handlebars.compile($("#grid-template").html()),
    rowTemplate:$(Handlebars.compile($("#grid-row-template").html())()),

    init:function(){
      if ( !this.model ) throw "this.model required";
      this.bind('change',this.proxy(this.render));
      this.render()
    },
    
    render: function(){
      var step=this.colCount,
      cells=this.model.all(),
      L=cells.length,
      counter=0,
      numRows=Math.ceil(cells.length/this.colCount),
      $row=$(this.rowTemplate);
      for(;numRows--;){
        var $rowInstance=$row.clone(),
        c=0;
        for(;c<this.colCount;c++){
          var cell = cells[counter++];
          if(!cell) continue;
          
          // write this way to use spine's built in appending functions that calls the jQuery $()
          // function multiple times to update the internal 'elements' property.
          // new CellController({ modelInstance:cell }).appendTo($rowInstance);
          // this.append($rowInstance);
          // if we aren't using the {elements: '...' } property, using these adds unnecessary overhead,
          // so we can just use the jQuery functions for better performance
          $rowInstance
            .append(new CellController({ modelInstance:cell }).el)
            .appendTo(this.el);
        }
      }
      
      this.el.fisheyeGrid({width:this.width,height:this.height});
      return this;
    }
  }),
  
  CellController = Spine.Controller.sub({ // Controller for individual gric cells
    
    cellTemplate:Handlebars.compile($("#grid-cell-template").html()),
    
    events:{ 'click .cell-example':'toggleColor' },
    
    init:function(){
      if(!this.modelInstance) throw 'when creating a CellController, you must call new CellController({modelInstance:cell})'
      
      this.modelInstance.bind('change',this.proxy(this.render)); // bind the
      this.render();
    },
    
    render:function(){
      var sourceStr=this.cellTemplate(this.modelInstance);// create an HTML string
      this.el.html(sourceStr); // fill the cell with the contents of the HTML string
      if(this.modelInstance.hasColor==='red'){ // check the modelInstance for color
        this.el.children('.cell-example').addClass('redColor'); // add the class if so
      }
    },
    

    toggleColor:function(event){ // Toggles the model's hasColor attribute
      event.stopPropagation(); // prevent the event from bubbling up and closing the grid cell

      this.modelInstance.hasColor = // set the model color property to the following...
        this.modelInstance.hasColor === 'red' ? // does the model have a red color?
          false : // yes, unset the color
          'red'; // no add a red color
      
      this.modelInstance.save(); // save the modelInstance, which fires the change then update event.
          // Since we bound render() to the this.modelInstance's event in 'init',
          // saving will re-render the template
    }
  }),

  
  UI = Spine.Controller.sub({ // Overall UI controller, initializes UI, including grids
    init:function(){

      var data={
        symbols:[{name:'ampersand',example:'@'},{name:'hash',example:'#'},{name:'exclamation',example:'!'}],
        numbers:$.map('zero,one,two,three,four,five,six,seven,eight,nine'.split(','),function(val,i){return {name:val,example:i} }),
        letters:$.map('ABCDEFGHIJKLMNOPQRSTU'.split(''),function(val,i){return {name:val,example:val} }),
      };
      // get the data from local storage.  If there is no data saved, save some.
      if(Symbol.all().length === 0) {$.map(data.symbols,function(val,i){return new Symbol(data.symbols[i]).save()})}
      if(Numbr.all().length === 0) {$.map(data.numbers,function(val,i){return new Numbr(val).save()})}
      if(Letter.all().length === 0) {$.map(data.letters,function(val,i){return new Letter(val).save()})}

      // instantiate the three grids
      var symbolGridController=new GridController({
        el:$('#symbols-grid'), // Since the grid alread exists in the HTML, manually set this.el to it
        sampleData:$.map('ABCDEFGHIJKLMNOPQRSTU'.split(''),function(val,i){return {name:val,example:val} }),
        model:Symbol, // include the related model as a property of this controller
        colCount:2, // specify the number of columns for this grid
        width:640, // specify the grid's height
        height:250 // and width
      }),
      numbersGridController=new GridController({
        el:$('#numbers-grid'),
        sampleData:$.map('zero,one,two,three,four,five,six,seven,eight,nine'.split(','),function(val,i){return {name:val,example:i} }),
        model:Numbr,
        colCount:5,
        width:640,
        height:250
      }),
      lettersGridController=new GridController({
        el:$('#letters-grid'),
        sampleData:$.map('ABCDEFGHIJKLMNOPQRSTU'.split(''),function(val,i){return {name:val,example:val} }),
        model:Letter,
        colCount:5,
        width:640,
        height:250
      });
    }
  }),
    
  renderedUI=new UI({el:$('#content')});

});
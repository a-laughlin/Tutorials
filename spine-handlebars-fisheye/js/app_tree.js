/*!
 * A simple Spine.js, Handlebars.js, and Fisheye Grid tutorial
 * Copyright 2011, Adam Laughlin
 * http://a-laughlin.com
 * Licensed under MIT & GPL version 2
 * http://static.a-laughlin.com/mit_license.txt
 * http://static.a-laughlin.com/gpl_license.txt
 * 
 * The sample data is similar to what you might find in a Google Adwords interface.
 * Campaigns have ad groups, and ad groups have keywords.  Campaigns, Ad Groups,
 * and Keywords, all have their own models.  Each cell in the grid, and the grid
 * itself, get Controllers. The click events on the cells are handled by the jQuery
 * fisheyeGrid plugin, so they're absent from the controllers.  In the keyword cells
 * are a link you can click to change its color.  That color state is stored in
 * localstorage in the examples below where it's enabled. The views are created by
 * Handlebars.js, and rendered to the page in the controllers.
 *
 * Cheers!
 * Adam
 */

$(document).ready(function(){

  // MODELS
  var Campaign = Spine.Model.sub({}),// Create our models
  AdGroup = Spine.Model.sub({}),
  Keyword = Spine.Model.sub({});

  Campaign.configure('Campaign','name'); // Configure the models with attributes
  AdGroup.configure('AdGroup','name','campaignId');
  Keyword.configure('Keyword','name','ctr','chart1','sparkChart','hasColor','campaignId','adGroupId');


  // CONTROLLERS
  var GridController = Spine.Controller.sub({
    rowTemplate:$($.trim($("#grid-row-template").html())),
    // In $rowTemplate above, we're using jQuery to create the row div instead
    // of compiling with Handlebars, since the row itself has no variables.
    // Feeding the template's HTML directly into jQuery's $ function creates a row div. We'll clone it later.
    
    init:function(){ // init creates runs when new GridController() is called
      this.render(); // init's only job here is rendering the grid
    },
    
    render: function(){ // render creates the grid on the page
      var tempCampaignId, tempAdGroupId,
      $el=this.el, // shortcut this.el for use in Keyword.each(), since it changes the context of "this".
      $rowTmpl=this.rowTemplate; // shortcut for rowTemplate in Keyword.each()
      
      Keyword.each(function(keyword){ // loop over each keyword to
        var $row=$rowTmpl.clone(); // clone our rowTemplate
        
        if( tempCampaignId !== keyword.campaignId ) { // when we're on a new campaign
          tempCampaignId = keyword.campaignId; // set the temp campaignId variable to the current campaign
          
          // Create a new CellController with the current campaign as its modelinstance
          // and append to the row its "el" property (a new div with the class "cell-campaign")
          $row.prepend( new CellController( {className:'cell-campaign', modelInstance:Campaign.find(tempCampaignId)} ).el );
        }
        
        if(tempAdGroupId !== keyword.adGroupId){ // when we're on a new adgroup
          tempAdGroupId = keyword.adGroupId; // set the previous adGroupId to the current one and... 
          $row.addClass('adgroup-row'); // add a row class for gestalt clustering keywords in each ad group with CSS
          // then append a new CellController
          $row.prepend( new CellController( {className:'cell-adgroup', modelInstance:AdGroup.find(tempAdGroupId)} ).el );
        }
        
        // Create a new KeywordCellController with the current keyword as its modelinstance
        // append the keyword objectcell to the current row
        $row.prepend( new KeywordCellController( {className:'cell-keyword', modelInstance:keyword} ).el )
          .appendTo($el); // append the row to the grid
      })
      
      // render the grid with the jQuery.fisheyeGrid plugin.
      // fisheyeGrid currently sets its own click events, and writes its own style tag.
      $el.fisheyeGrid({ width:this.width, height:this.height, minWidth:this.minWidth, minHeight:this.minHeight, steps:this.steps, speed:this.speed });
    }
  });

  // Controller for individual grid cells.  We'll use it for the Campaign and AdGroup cells, and 
  // subclass it for the keyword cells
  CellController = Spine.Controller.sub({
    
    // Compile a Handlebars template (a function that returns an HTML string when called)
    template:Handlebars.compile($("#cell-template").html()),
    
    init:function(){ // runs when CellController is created with new CellController()
      if(!this.modelInstance) throw 'remember to use new CellController({modelInstance:foo}) when creating a new CellController'
      this.modelInstance.bind('change',this.proxy(this.render)); // render the cell when the modelInstance's change event fires
      this.render(); // render the cell the first time
    },

    render:function(){
      var sourceStr=this.template(this.modelInstance);// create an HTML string
      this.el.html(sourceStr); // fill the cell with the contents of the HTML string
    }
  }),


  KeywordCellController=CellController.sub({ // Controller  for just the keyword cells
    // In template, store a handlebars function that will return a templated string.
    // Since KeywordCellController is a subclass of CellController, defining template here
    // overrides the template defined in CellController
    template:Handlebars.compile($("#cell-keyword-template").html()),
    
    events:{ 'click .span-red':'toggleColor' }, // bind the toggleColor function to descendent divs' click events

    render:function(){
      var sourceStr=this.template(this.modelInstance);// create an HTML string from the template
      this.el.html(sourceStr); // fill the cell with the contents of the HTML string
    },

    toggleColor:function(event){ // Toggles the model's hasColor attribute
      event.stopPropagation(); // prevent the event from bubbling up and closing the grid cell
      
      var color = this.modelInstance.hasColor === 'red' ? // does the model have a red color?
          false : // yes, set color variable to the opposite - false
          'red'; // no, set color variable to the opposite - 'red'
      
      this.modelInstance.updateAttribute('hasColor', color ); // update the hasColor attribute
      // Note: this.modelInstance.updateAttribute() automatically calls this.modelInstance.save() .
      // Calling save() automatically triggers the modelInstance's update() and change() events.
      //
      // Since we bound this.render() to the change event in CellController.init with...
      // "this.modelInstance.bind('change',this.proxy(this.render))" , 
      // calling updateAttribute() here automatically re-renders the cell.
    }
  }),

  UI = Spine.Controller.sub({ // Overall UI controller, initializes UI (which consists of a single grid in this case)
    
    init:function(){
      // Uncomment this section to enable local storage
      $.each([Keyword,AdGroup,Campaign],function(k,v){  // loop over the different models
        v.extend(Spine.Model.Local); // enable local storage persistence
        v.fetch(); // get the models from local storage if there
        // v.destroyAll();  // temporary debugging function to clear the stored records each time
      });
      
      if(Keyword.count()===0) { // if fetching from localstorage returns nothing...
        
        // Define some sample data for the purpose of this tutorial
        
        function exampleSpark(width,height){ // function to return an example spark chart from the Google charts api.
          var i=0,
          str='0';
          for (;i<10;i++) str += ','+ Math.floor(Math.random()*10);
          return "http://chart.apis.google.com/chart?chf=a,s,FFFFFF&chs="+width+"x"+height+"&cht=ls&chco=AC97DA&chds=0,10&chd=t:"+str+"&chls=2";
        }
        
        var exampleCampaigns=[ // Sample JSON data
          {"name":"A Campaign",
            "adGroups":[
              {"name":"Foos",
                "keyword":[
                  {"name":"foo1","ctr":"2%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)}
                ]
              },
              {"name":"Bars",
                "keyword":[
                  {"name":"bar1","ctr":"6%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"bar2","ctr":"3%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                ]
              },
              {"name":"Plants",
                "keyword":[
                  {"name":"Tapioca","ctr":"2%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"Plastic","ctr":"1%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"Bonsai!!!","ctr":"3%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)}
                ]
              }
            ]
          },
          {"name":"B Campaign",
            "adGroups": [
              {"name":"Fish",
                "keyword":[
                  {"name":"guppy","ctr":"5%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"flounder","ctr":"2%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"bass","ctr":"2%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"sushi","ctr":"4%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"sashimi","ctr":"1%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)},
                  {"name":"yummy","ctr":"7%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)}
                ]},
              {"name":"Mythical Animals",
                "keyword":[
                  {"name":"unicorns","ctr":"103%","chart1":exampleSpark(125,125),"sparkChart":exampleSpark(100,25)}
                ]}
            ]
          }
        ],
        camp,
        group;

        // loop over the sample JSON data to create the model instances
        $.each(exampleCampaigns, function(c,campaign){ 
          camp = Campaign.create(campaign); // create a new Campaign model instance from the campaign object
          $.each(campaign.adGroups,function(g,adGroup){  // loop over Ad Groups
            adGroup.campaignId=camp.id; // add the parent campaign ID to the adGroup
            group = AdGroup.create( adGroup ); // create a new AdGroup model instance from the adGroup object
            $.each(adGroup.keyword,function(k,keyword){ // loop over the Ad Group's keywords
              keyword.campaignId=camp.id; // add the parent campaign ID to the keyword object
              keyword.adGroupId=group.id; // add the parent adGroup ID to the keyword object
              Keyword.create( keyword ); // create a new Keyword model instance from the keyword object
            })
          })
        })
      }
      
      // instantiate the grid
      var campaignGridController = new GridController({
        el:$('#campaign-grid'), // Since the grid alread exists in the HTML, manually set this.el to it
        width:800, // specify the grid's height
        height:450, // ... and width,
        minWidth:80, // ... and minimum contracted cell width
        minHeight:20, // ... and minimum contracted cell height
        steps:8, // and # of steps to iterate over
        speed:20 // and the speed per step in ms
      })
    }
    

  }),

  // initialize the UI in the content div
  renderedUI=new UI({el:$('#spine-example')});

});
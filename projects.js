var projects_container = $('.container-projects');
var projects_wrapper = $('.projects-wrapper');

var appendable = "";
var siteData = null;
var projects_obj = {}; // Legacy format, will be populated from data.json

// Fetch data from JSON file
console.log('[projects.js] Starting data.json fetch...');
fetch('data.json')
  .then(response => {
    console.log('[projects.js] Fetch response received:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('[projects.js] Data parsed successfully:', data);
    siteData = data;
    
    // Filter active projects only
    const activeProjects = data.projects.filter(proj => proj.active);
    console.log(`[projects.js] Found ${activeProjects.length} active projects out of ${data.projects.length} total`);
    
    // Convert new format to legacy format for existing rendering logic
    activeProjects.forEach(proj => {
      console.log(`[projects.js] Processing project: ${proj.id}`);
      projects_obj[proj.id] = {
        code: proj.id,
        title: proj.title,
        sub_title: proj.subtitle,
        time_text: proj.year,
        description: proj.shortDescription,
        full_description: proj.fullDescription,
        badges: proj.skills,
        images: proj.images.map(img => ({
          src: img.src,
          big_src: img.bigSrc,
          alt: img.alt,
          text: img.caption,
          class: img.class,
          link: img.link
        }))
      };
    });
    
    console.log('[projects.js] Projects converted to legacy format:', Object.keys(projects_obj));
    
    // Render projects
    renderProjects();
  })
  .catch(error => {
    console.error('[projects.js] Error loading data.json:', error);
    // Fallback: show error message
    projects_wrapper.append('<p class="text-center">Error loading projects data. Please refresh the page.</p>');
  });

function renderProjects() {
  console.log('[projects.js] Starting renderProjects()');
  appendable = "";
  // Watgrid
  winegrid:{
    code: "winegrid",
    title: "Winegrid",
    sub_title: "The Winegrid platform for the company Watgrid",
    time_text: "2019",
    description:
    "The platform to be developed for Winegrid was quite challenging "+
    "as it encompassed a complex information architecture which generated a gap "+
    "with the user's mental model. In order to test and allow common ground of understanding "+
    "between the team members a hi-fi prototype was made in Adobe XD. "+
    "This made it easier to guess implementation efforts and the validity of some of the functionalities.",
    full_description: 
    "<h6> Product</h6>"+
    "<p>Watgrid's product, Winegrid, was a very interesting project "+
    "and I'm very glad I got to be part of it during my master's. "+
    "It is a groundbreaking technology, with a complex information architecture. "+
    "They develop and produce sensors to monitor wine production in real time, "+
    "alongside a SaaS platform to control their devices. "+
    "I was working as a UX designer, supporting the platform's development team.</p>"+

    "<br><h6>UX Challenges</h6>"+
    "<p>The fact that it was a company just popping out of start-up status, "+
    "meant there was still some distance between the engineer's mental model, "+
    "and that which would make sense for the final users. "+
    "Also, few of the engineers understood how to produce wine "+
    "and none of them how a full sized industrial production of wine works. "+
    "So it was necessary to understand the differences, "+
    "create a new mental model and reflect this on the platform itself. "+
    "For about a year this was a work in progress, as the platform was already up and running. "+
    "I studied, designed and developed, also as new features were being introduced "+
    "to the platform on a regular basis. Gladly, new investments were made that changed our game. </p>"+

    "<br><h6>Development Challenges</h6>"+
    "<p>Most notoriously, I designed and developed a selection element that faced a challenged, "+
    "and of which I am quite satisfied. The user needs to be able to select "+
    "the daily reading frequency of each sensor, but that can't be more that once every thirty minutes, "+
    "and it has to be in equal intervals throughout the day. These were technical constraints. "+
    "The user should also be able to select when the first read of the day was to happen. "+
    "In order to avoid explaining to the user all the necessary, and to avoid error, "+
    "it was necessary for the affordance of this element to enforce all of this, "+
    "and be clear at the same time. So a slider for the frequency was chosen, "+
    "alongside a scheduler that allowed to select the initial time and view all the "+
    "other consecutive schedule readings. To further ensure readability, "+
    "a clarifying human readable sentence was output dynamically with the selection. "+
    "This was developed in Angular and later translated into Jquery.</p>"+

    "<br><h6>Work in Graphical Design and Marketing</h6>"+
    "<p>Besides working as a UX Designer, I also supported the marketing team, "+
    "mostly with graphical design. The branding of the company was also not solidified, "+
    "so this was a challenging process as well. Most notoriously, "+
    "I designed a quick guide for users, in a single sheet of A4, "+
    "to go with every shipped device. It used only iconography, "+
    "so that translated versions were not necessary, and a QR Code directed for further clarifications, "+
    "although this was reported as not used. I also produced an instructional video and maintained the website's activity.</p>",
    badges: 
    [
      "UI design",
      "Adobe XD",
      "fast prototyping",
      "usability testing"
    ],
    images:[
    {
      src: "res/img/loading-giffer.gif",
      text: 'Animated loading logo',
      class: 'b-white b-center b-size-75'
      //,
      //alt: "Image of Banco de Tempo de Feira"
    },
    {
      src: "res/img/winegrid-adobe-logo.png",
      alt: "Winegrid product logo",
      text: "Adobe XD Prototype",
      link: {
        type:"axd",
        href: "https://xd.adobe.com/view/25bdfd92-4b17-4a25-71a9-c02c1daecb0c-538c/",
        icon:"fa fa-external-link-alt"
      }
    },
    {
      src: "res/img/timer-selection-ui.webp",
      alt: "Screen capture of a frequency selector interface",
      text: "Frequency Selector",
      link: {
        type: "yt",
        href: "res/img/big/timer-selection-ui.mp4",
        icon: "fa fa-play-circle"
      }
    }]
  },
  // BDT Feira
  bdtfeira:{
    code: "bdtfeira",
    title: "Banco de Tempo de Santa Maria da Feira",
    sub_title: "Project for Master's dissertation",
    time_text: "2019",
    description: 
    "This project studied the potential contribution of multimedia technology "+
    "for a timebanking community in Santa Maria da Feira, Portugal. "+
    "As a proof of concept, two prototypes were developed for a majorly senior community.",
    full_description: 
      "<h6># Collaborative Economy</h6>"+
      "<p>The Collaborative Economy is a phenomenon of the recent decade, "+
      "where new and old habits of exchange were developed and re-discovered "+
      "in the digital realm. Most notoriously - new methods of creating value "+
      "collaboratively; making use of inert value and sharing goods, services "+
      "and even time - have created a new highly valued market, challenged policies, "+
      "and promoted a more sustainable way for people to face their daily challenges. "+
      "There are also companies that tag along with the promises of social, "+
      "economic and ecological sustainability, but fail to deliver and "+
      "end up just exploiting members of their digitally created communities "+
      "for their own gain.</p>"+
      
      "<br><h6># Time Banks</h6>"+
      "<p>In the meantime, there's an idea that has existed far before, "+
      "and that is used mostly for social rehabilitation and "+
      "economic self-reliance in smaller communities. We're talking about "+
      "time-banks, where people exchange their time, valuing everyone's "+
      "time equally. So an hour from a plumber is as valuable as an hour "+
      "from a tutoring mathematician. One would request a service "+
      "and \"pay\" the person in time-credits, equivalent to the time "+
      "spent in providing it. And this person will be able to exchange "+
      "similarly with other members.</p>"+
      
      "<br><h6># Time Banks in Portugal</h6>"+
      "<p>In Portugal, Time Banks have existed for a while and have a "+
      "few slightly specific rules. Each agency, consisting usually of "+
      "easily below 200 members, should validate each member upon joining, "+
      "through a personal interview. The agency also intermediates each "+
      "exchange, to promote that all members have an equal opportunity to "+
      "contribute. This network, in Portugal, has very little digital "+
      "support for their members and coordinators.</p>"+
      
      "<br><h6># A different definition of value</h6>"+
      "<p>This system is based on a marxist conception of value, of "+
      "which modern notions have undermined, and probably wouldn't be a "+
      "system sustainable on a large scale, although something similar "+
      "exists spanning through the United Kingdom. This system's value lies "+
      "in small communities, and ususally undermined groups of society, "+
      "strengthening social ties, their notion of self-worth, and overall "+
      "health of the individuals. </p>"+
      
      "<br><h6># Idea</h6>"+
      "<p>Contrasting the digital development of modern Collaborative "+
      "Economy platforms, with the actual social sustainability contribution "+
      "of Time banks in Portugal, this project took to study and develop "+
      "a prototype of a platform for Time Banks in Portugal, collaborating "+
      "with the agency of Santa Maria da Feira. This community was chosen "+
      "for being very dynamic and with a very stable organization, a strong "+
      "sense of belonging between members, and also, for the convenience of "+
      "proximity.</p>"+
      
      "<br><h6># Challenges</h6>"+
      "<p>One of the biggest challenges was lining up with how they value "+
      "this network. The value in belonging was not so much in obtaining "+
      "services and saving money, as one might expect, although a lot of "+
      "value could be obtained from here. Food, home maintenance services, "+
      "tutoring, transportation, dance/yoga/painting classes etc... The main "+
      "motivation was to be able to participate and underlyingly feel valued, "+
      "and most times even just to have company. This makes sense as most of "+
      "the more active members are retirees. This was possible to realize "+
      "through questionnaires and also visits to the community with conversations "+
      "over tea, getting to know if there was any community spirit, how "+
      "some of them joined, some particular situations, and how the agency "+
      "itself functions. The questionnaires aimed at understanding their "+
      "motivations, current use of technology and foreseable usage of a "+
      "digital platform for the Time Bank.</p>"+

      "<p>Another challenge was to establish the contribution that digital "+
      "technologies might have to help them with their main problem: there's "+
      "a higher tendency in members offering services than requiring them. "+
      "Two conclusions were obtained in regard to this issue. The literary "+
      "study established that changing the way their activity was framed by "+
      "their internal and external discourse would make a significant difference. "+
      "The empirical study established that a simple and familiar interface "+
      "to choose and \"purchase\" services would motivate members to request "+
      "more exchanges. </p>"+
      "<blockquote class='blockquote my-4 mx-5'>"+
      "\"If I need a ride somewhere, I don't request from the TimeBank, "+
      "I take a cab.\""+
      "<footer class='blockquote-footer'>a timebank participant*</footer>"+
      "</blockquote>"+
      
      "<br><h6># Prototypes</h6>"+
      "<p>Two prototypes were eventually developed and tested, with "+
      "different purposes. A first one in Wordpress to test the "+
      "technology's reliability, as the maintenance of the platform "+
      "should not require technical capacity. And a second on in Adobe XD "+
      "to validate an established design and proof of concept.</p>"+
      "<p>Results were certainly positive, and this project might still "+
      "come to fulfilled fruition.</p>"+
      "<blockquote class='blockquote my-4 mx-5'>"+
      "\"I never make any requests, but since it's this easy, I'll "+
      "definitely start making some.\""+
      "<footer class='blockquote-footer'>another timebank participant*</footer>"+
      "</blockquote>"+
      "<hr>"+
      "<p><br><i style='font-size:80%'>*not verbatim</i></p>",
    badges: 
    [
      "UI design", 
      "Wordpress",
      "Adobe XD",
      "User Research",
      "fast prototyping",
      "usability testing"
    ],
    thumbnail_src: "res/img/bdt-feira-2.jpg",
    thumbnail_alt: "Image of Banco de Tempo de Feira",
    images:[
    {
      src: "res/img/bdt-feira-2.jpg",
      alt: "Image of Banco de Tempo de Feira"
    }
    //,{
    //  src: "",
    //  alt: "about the project",
    //  text: "Read More +"
    //  //,
    //  //link: {
    //  //  type: "txt",
    //  //  href: "https://xd.adobe.com/view/25bdfd92-4b17-4a25-71a9-c02c1daecb0c-538c/",
    //  //  icon: "fa fa-external-link-alt"
    //  //}
    //}
    ]
  },
  //  Notify Me
  notifyme:{
    code: "notifyme",
    title: "Notify Me",
    sub_title: "Application for Master's",
    time_text: "2017",
    description: "The final year of the master's implemented a method in which different classes/disciplines colaborated in a single project. "+
    "Notify Me was a project that experimented with detecting user's TV usage. This was exploited using a Bluetooth Beacon to detect proximity using an App. "+
    "This App promised better TV suggestions made by algorythms and the user's history. "+
    "An additional gamification concept was developed where users could bet on some TV show's content against each other, "+
    "using custom currency and applying for monthly prizes.",
    badges: 
    [
      "UI design", 
      "HTML/ CSS/ Javascript", 
      "React+Redux",
      "Arduino",
      "Bluetooth",
      "fast prototyping",
      "usability testing"
    ],
    thumbnail_src: "res/img/web_hi_res_512.png",
    thumbnail_alt: "Notify Me project logo",
    images:[
    {
      src: "res/img/logo_notifyme_x300.png",
      big_src: "res/img/big/logo_notifyme_x512.png",
      alt: "Notify Me project logo",
      text: "Notify Me project logo"
    },{
      src: "res/img/notifier_3d_screenshot_x300.JPG",
      big_src: "res/img/big/notifier_3d_screenshot_x554.JPG",
      alt: "image of the 3D object for the bluetooth beacon",
      text: "3D object for the bluetooth beacon"
    },{
      src: "res/img/BetTV_aposta_x300.jpg",
      big_src: "res/img/big/BetTV_aposta_x720.jpg",
      alt: "screenshot of a screen from BetTV concept",
      text: "BetTV bet screen"
    },{
      src: "res/img/easyTv_watching.jpg",
      alt: "screenshot of a screen from concept EasyTV app",
      text: "EasyTV watching screen"
     }]
  },
  //  Babel Rock
  babelrock:{
    code: "babelrock",
    title: "Babel Rock",
    sub_title: "Interactive Music-Playing Physical-Globe",
    time_text: "2017",
    description: "Project for a master's class, with the purpose of exploiting physical objects for digital interactions. "+
    "Here the sphere was studied to be used as an interface."+
    "A prototype was developed using two potentiometers, with which users can select a country "+
    "and listen to it's music.",
    badges: 
    [
      "Arduino",
      "3D printing"
    ],
    thumbnail_src: "res/img/default.jpg",
    thumbnail_alt: "placeholder image",
    images:[{
      src: "res/img/default.jpg",
      alt: "placeholder image"
     }]
  },
  //  Tilt Game
  tiltgame:{
    code: "tiltgame",
    title: "Tilt Game - Feira de Março",
    sub_title: "Video Game with Lampwave Studio",
    time_text: "2015",
    description: "A colaboration with Lampwave Studio to develop a video-game for a special event. It used the gyroscope to generate a ball-in-a-maze game.",
    badges: 
    [
      "vector design",
      "video-game design",
      "UI design"
    ],
    images:[
    {
      src: "res/img/tilt_game_x300.jpg",
      big_src: "res/img/big/tilt_game_x543.jpg",
      alt: "screenshot of the gameplay",
      text: "screenshot of the gameplay"
    }]
  },
  // Geo Freita
  geofreita:{
    code: "geofreita",
    title: "Geo Freita",
    sub_title: "Application for Bachelor's",
    time_text: "2014",
    description: "",
    badges: 
    [
      "vector design",
      "digital composition",
      "UI design HTML/ CSS/ Javascript",
      "PhoneGap",
      "Geolocation"
    ],
    images:[
    {
      src: "res/img/geofreita_x300.jpg",
      big_src: "res/img/big/geofreita_x1024.jpg",
      alt: "preview image for 'Gea Freita' project"
    }] 
  },
  //  8 80
  oitoouoitenta:{
    code: "oitoouoitenta",
    title: "8/80",
    sub_title: "Photography Director in a Shortmovie for bachelor's",
    time_text: "2013",
    badges: 
    [
      "Video capture and editing", 
      "Script writing"
    ],
    thumbnail_src: "res/img/8 80 thumbnail x720.png",
    thumbnail_alt: "thumbnail image of the title screen",
    images:[
    {
      src: "res/img/8_80_thumbnail_x300.png",
      big_src: "res/img/big/8_80_thumbnail_x720.png",
      alt: "thumbnail image of the title screen",
      text: "Title Screen"
    },
    {
      src: "res/img/8_80_thumbnail_2_x300.png",
      big_src: "res/img/big/8_80_thumbnail_2_x720.png",
      alt: "thumbnail image of a character lighting a cigar",
      text: "badass #1"
    },
    {
      src: "res/img/8_80_thumbnail_3_x300.png",
      big_src: "res/img/big/8_80_thumbnail_3_x720.png",
      alt: "thumbnail image of a man looking surprised at a script",
      text: "badass #3"
    },
    {
      src: "res/img/8_80_thumbnail_x300.png",
      alt: "thumbnail image of the title screen",
      text: "Youtube",
      link: {
        type:"yt",
        href: "https://youtu.be/JrcJihn8ID8",
        icon:"fa fa-play-circle"
      }
    }]
  }
};


//external-link-square-alt
//external-link-alt
//youtube
//adobe
/*
 * picture
 * external link
 * * youtube  -yt
 * * Adobe XD -axd
 * * website  -web
 * 
*/
window.onpopstate = function(e){
        //console.log("popState",e);
    if(!e.state){
        //document.getElementById("content").innerHTML = e.state.html;
        //document.title = e.state.pageTitle;
        //console.log("popStateE",e);
        closeText();
    }
};
/*
  {
    src: "res/img/8_80_thumbnail_3_x300.png",
    big_src: "res/img/big/8_80_thumbnail_3_x720.png",
    alt: "thumbnail image of a man looking surprised at a script",
    text: "badass #3"
  },
  {
    src: "res/img/8_80_thumbnail_x300.png",
    alt: "thumbnail image of the title screen",
    text: "Youtube",
    link: {
      type:"yt",
      href: "https://youtu.be/JrcJihn8ID8",
      icon:"fa fa-play-circle"
    }

*/
var temporary_content_class = 'cgc';
function openText(ref){
  if(!ref)return false;
  var tracker = null;
    if ("ga" in window) {
        tracker = ga.getAll()[0];
    }else{
      console.log("ga error");
    }
    if(tracker)
        tracker.send('event', 'Interaction', 'ref', 'Read More');


  projects_container.addClass('fade-background fade-background-t');
  projects_container.children().addClass('o-t');
  projects_container.children().addClass('o-0');
  var content ="";

  content +=
  "<div class='"+temporary_content_class+" absolute-wrapper py-5 px-2 mx-auto o-t o-0'>"+
  "<h2>"+projects_obj[ref].title+"</h2>"+
  "<p>"+projects_obj[ref].description+"</p>"+
  "<p class='text-center' style='font-size:25px'>§</p>"+
  //"<p>"+projects_obj[ref].full_description+"</p>"+
  ""+projects_obj[ref].full_description+""+
  "<div class='text-right'><button class='btn btn-light' onclick='closeText(\"proj-"+ref+"\")'>Cool</button></div>"+
  "</div>";
  
  projects_container.append(content);
  setTimeout(function(){
    projects_container.children(':not(.'+temporary_content_class+')').hide();
    //projects_container.addClass('ovf-hidden');
    $('.'+temporary_content_class).removeClass('o-0');
    window.scrollTo(0,0);
  },500);

  history.pushState({hash:"#"+ref}, "", "#"+ref);
}
function closeText(hash){
  //d-flex flex-column justify-content-between
  $('.'+temporary_content_class).addClass('o-0');
  //Reinstante visibility in the previous content
  projects_container.children().removeClass('o-t o-0');
    projects_container.removeClass('fade-background');
  setTimeout(function(){
    projects_container.children().show();
    //projects_container.removeClass('ovf-hidden');
    //destroy temporary children
    $('.'+temporary_content_class).remove();
    projects_container.removeClass('fade-background-t');
    if(hash)
    location.hash = "#" + hash;
  },300);
}


$.each(projects_obj, function(k,proj){
  appendable += "<section id='proj-"+k+"' data-depth='0.4'>";
  /* vv STICKY HEADER vv */
  appendable += "<div class='row sticky-header-wrapper'>";

  appendable += 
  "<div class='col-12 col-md-10 pt-2'>"+
  "<h3># "+proj.title+"</h3>"+
  "</div>";

  /*appendable += (i+1 === projects_obj.length) ?
  "<div class='d-none d-md-block col-md-2 pt-3 text-right'>"+
  "<a class='btn btn-sm btn-default'href='#top'>top ↑</a>"+
  "</div>" :*/
  appendable += 
  "<div class='d-none d-md-block col-md-2 pt-3 text-right'>"+
  "<span class='float-right mb-2 text-muted'>"+proj.time_text+"</span>"+
  "</div>";
  //"<a class='btn btn-sm btn-default'href='#proj-"+projects_obj[i+1].code+"'>next ↓</a>"+
  //"<span class='col-12 white-fade'>"+
  //"</span>"+

  appendable += "</div>";

  /* ^^ END STICKY HEADER ^^ */

  appendable += "<div class='row conteudo'>";

  /* vv LEFT COLUMN vv */
  appendable += "<div class='col-12 col-sm-6 coluna-esq'>";
  appendable += "<div class='row'>"+ 
  "<div class='col-9 col-md-12'>"+
  "<h6>"+proj.sub_title+"</h6>"+
  "</div>"+
  "<div class='col-3 d-md-none'>"+
  "<span class='float-right mb-2 text-muted'>"+proj.time_text+"</span>"+
  "</div>"+
  "</div>";

  appendable+="<p class='badge-list'>";
  $.each(proj.badges, function(k, b){
    appendable+="<span class='badge badge-pill badge-dark'>"+b+"</span>";
  });
  appendable+="</p>";

  if(proj.hasOwnProperty("description") && proj.description.length > 2)
    appendable += "<p>"+proj.description+"</p>";
  

  appendable+="</div>";
  /* ^^ END LEFT COLUMN ^^ */

  /* vv RIGHT COLUMN vv */
  appendable+="<div class='col-12 col-sm-6 coluna-dir'>"+
  "<div class='card-columns text-right card-group-xs-1-lg-2'>";

  /* Items */
  $.each(proj.images, function(i, img){
    var classer = img.hasOwnProperty('class') ? " "+img.class : '';
    
    appendable+="<div class='card'>";
    //if(img.no_lightbox){

    var href = "href='" + (img.link ? img.link.href : (img.big_src || img.src))+"'"+(img.link?" target='_blank' rel='noopener noreferrer'":"");

    if(img.src){
      appendable+=
      "<a "+href+" class='card-img no-lb faux-img-cards"+classer+"' style=\"background-image: url('"+img.src+"')\" title='"+img.alt+"'>"+
      "<img src='"+img.src+"' alt='"+img.alt+"'>";
    }else{
      appendable+=
      "<a class='card-img no-lb faux-img-cards"+classer+"' title='"+img.alt+"'>";
    }
    if(img.link){
      appendable+=
      "<span class='card-img-link-icon d-flex justify-content-center align-items-center lk-"+img.link.type+"'>"+
      "<i class='"+img.link.icon+"'></i>"+
      "</span>";
    }
    
    appendable+="</a>"; 
  
    if(img.text){
      appendable+=
      "<p>"+img.text+" "+ (img.link ? "<i class='fa fa-link'></i>" : "") + "</p>";
    }
    appendable+="</div>";
  });

  if(proj.full_description){
    appendable+=
    "<button class='btn btn-block btn-dark' onclick='openText(\""+k+"\")'>Read More +</button>"
  }
  /* END Items*/

  appendable+="</div>"+
  "</div>";
  /* ^^ END RIGHT COLUMN ^^ */

  appendable+="</div>"+
  "</section> ";
});

console.log('[projects.js] HTML generation complete, appending to DOM');
projects_wrapper.append(appendable);
console.log('[projects.js] Projects rendered successfully');

// Handle URL hash for direct linking
$(document).ready(function(){
  console.log('[projects.js] Document ready, checking hash:', window.location.hash);
  const hash = window.location.hash.substring(1);
  if (hash) {
    openText(hash);
  }
});
}

// Keep all existing helper functions unchanged
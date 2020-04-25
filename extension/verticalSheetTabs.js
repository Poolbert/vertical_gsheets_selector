/*
Resize events
--------------
1. window resizes
2. hide menus
3. hide the side app thing

Next steps
----------------------------------
1. DONE Handle hiding of the side panel - might require refactoring input to resize
2. DONE Add listener for bottom sheet select updating sidebar
3. DONE resize by dragging
	- cursor is in place for action - needs callbacks
4. delete/rename listener
5. DONE "add sheet" listener
   - add sheet puts a sheets to the right of the current sheet
6. DONE fix menu loading - run delayed check instead of fixed wait
7. DONE move listeners to parents of vert-sheets
8. DONE fix clicking - color the whole sheet
9. DONE add indictor for resizing
10. try resizing sheet text on dragging instead of showing a temporary line
11. allow resizing in empty space in sidebar ...
12. DONE make border of sheets black to avoid strange color when selected
13. support move sheet detection
   - on mouse down fire a listener that looks for mouse up

//Sidebar structure
//----------------------------------
	//sidebar
	//   - sidebar-header
	//	     - sidebar-title
	//		 - sidebar-close
	//			 - docs-icon goog-inline-block
	//			     - docs-icon-close-white
	//	 - sidebar-content
	//	     - jim-links-container (ID)


//Delete, rename .docs-sheet-tab-menu
<div class="goog-menu goog-menu-vertical docs-sheet-tab-menu goog-menu-noicon docs-menu-hide-mnemonics" role="menu" aria-haspopup="true" style="user-select: none; visibility: visible; left: 205.313px; top: 79.9827px; display: none;">
   <div class="goog-menuitem" role="menuitem" id=":z" style="user-select: none;">
      <div class="goog-menuitem-content" style="user-select: none;">Delete</div>
   </div>
   <div class="goog-menuitem" role="menuitem" id=":10" style="user-select: none;">
      <div class="goog-menuitem-content" style="user-select: none;">Duplicate</div>
   </div>
   


//container for the sheets
<div class="docs-sheet-container-bar goog-toolbar goog-inline-block" role="toolbar" style="user-select: none; width: 916px;" aria-activedescendant=":1u">
   <div class="goog-inline-block docs-sheet-tab docs-material" role="button" aria-expanded="false" tabindex="0" aria-haspopup="true" id=":y">

//toggle side panel
//<div class="companion-collapser-button-container" aria-label="Toggle side panel" role="navigation">
   <div class="app-switcher-button companion-collapser-button" aria-pressed="false" role="button" aria-label="Hide side panel" tabindex="0" style="user-select: none;">
   
   
//sheet dropdown
//<div class="docs-icon goog-inline-block docs-sheet-tab-dropdown" aria-hidden="true">
   <div class="docs-icon-img-container docs-icon-img goog-inline-block docs-icon-arrow-dropdown">&nbsp;</div>
</div>



*/

//#region globals
var menuIsHidden = false;
var sideIsHidden = false;
var gridHeight;
var xyz = 1;

//We don't hijack into any of the functions for resizing so we basically
//need to track this at a known state, then on an event, call our code after
//this changes value
var sidePanelWidth;
var n_tries = 0;
var activeTag;
var sheetMenuListenerInitialized = false;
//Not sure what to make these values ...
var sidebarMinWidth = 80;
var sidebarMaxWidth = 500;

//#endregion globals


const ACTIVE_SHEET_TAB_CLASS = 'docs-sheet-active-tab';
const HSHEET_NAME_CLASS = 'TODO'








//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//						Sidebar Actions
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Sidebar Actions

function getSidebarTag(){
	return document.getElementById('vert-sidebar');
}

function launchSideBar(){

	//  We launch from the menu so it can't be hidden

	//var viewModeButton = document.getElementById('viewModeButton');
	//var tooltip = viewModeButton.getAttribute('data-tooltip')
	//Hidden => Show the menu
	//Not-Hidden => Hide the menu
	//menuIsHidden = tooltip[0] === 'S';


	showSidebar();

	populateNavLinks();

	resizeSidebar("init");
}

function createVSheetTag(sheetName){
	//Creates tag but does not attach it
	let tag = document.createElement('div');
	//For manipulation later ...
	tag.setAttribute('id','sidebar-' + sheetName);
	tag.setAttribute('class','vsheet-main')
	tag.style.display = 'flex'; //For left right display of t2,t3
	tag.style.overflow = 'hidden'; //If the sheet name is too long hide it until user resizes
	tag.style.backgroundColor = '#f1f3f4';
	tag.style['whiteSpace'] = 'nowrap';
	tag.style.cursor = 'pointer';
	var t2 = document.createElement('div');

	t2.setAttribute('class','vsheet-left');
	t2.style.cursor = 'ew-resize';
	t2.style.width = '5px';
	//left - only put border on bottom
	t2.style.borderWidth = '0 0 1px 0';
	t2.style.borderStyle = 'solid';
	t2.style.borderColor = 'black';
	t2.style.display = 'inline-block';
	//Not sure why width is not being respected with only 1 space
	t2.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

	//https://stackoverflow.com/questions/4171286/how-to-make-a-div-with-no-content-have-a-width
	//This helps but doesn't force the desired spacing ...
	//t2.style.minHeight = '1px';

	var t3 = document.createElement('div');
	t3.setAttribute('class','vsheet-right');
	t3.style.paddingLeft = '5px';
	//border on right and bottom
	t3.style.borderWidth = '0 1px 1px 0';
	t3.style.borderStyle = 'solid';
	t3.style.borderColor = 'black';
	t3.textContent = sheetName;
	t3.style.display = 'block';
	t3.style.width = '100%'; //If not there, the border shows up at the end of the word
	t3.style.overflow = 'hidden';
	t3.style.fontWeight = 'bold';


	tag.appendChild(t2);
	tag.appendChild(t3);

	return tag;
}

function populateNavLinks(){

	var parent = getVSheetsHolder();
	var sheetTags = document.getElementsByClassName('docs-sheet-tab');

	parent.innerHTML = '';
	activeTag = null;

	for (var i = 0; i < sheetTags.length; i++) {

		var sourceTag = sheetTags[i];
		var spanTag = sourceTag.querySelector('.docs-sheet-tab-name');
		let sheetName = spanTag.textContent;

		var newTag = createVSheetTag(sheetName)

		//TODO: Make constant ...
		if (sourceTag.classList.contains(ACTIVE_SHEET_TAB_CLASS)){
			setActive(newTag);
		}

		parent.appendChild(newTag);

	}

}

function createSidebar(){

	//var sidebar
	var vs = document.createElement('div');
	vs.setAttribute('id','vert-sidebar');
	vs.style.display = 'none'; //Hidden to start, will go to flex
	vs.style.position = 'absolute'; //We set position when showing (or other things)
	vs.style.width = '100px';

	//var left - we might get rid of this and move it's functionality into
	//divs
	var vl = document.createElement('div');
	vl.style.backgroundColor = 'black';
	//Sometimes 1px was showing as 0.985 or something like that and thus
	//wasn't being rendered ...
	vl.style.width = '2px';
	vl.style.cursor = 'ew-resize';
	//hack to ensure this is shown, not sure why it is needed ...
	vl.innerHTML = '&nsbp;&nbsp;&nsbp;&nbsp;';
	vl.addEventListener('mousedown',vsheetInitiateResize);
	vs.appendChild(vl);

	//var right
	var vr = document.createElement('div');
	vr.style.backgroundColor = 'white';
	vr.style.width = '100%'; //Starting width, might resize
	vs.appendChild(vr);

	//var header
	var vh = document.createElement('div');
	vh.setAttribute('id','vert-header');
	vh.style.backgroundColor = '#616161';
	vh.style.overflow = 'hidden';
	vh.style.color = 'white';
	vh.style.fontWeight = 'bold';
	vh.style.display = 'flex';
	vh.style.cursor = 'default';
	vh.style.borderWidth = '1px 1px 1px 0';
	vh.style.borderStyle = 'solid';
	vh.style.borderColor = 'black';
	vr.appendChild(vh);

	//var header #1
	var vh1 = document.createElement('div');
	vh1.style.cursor = 'ew-resize';
	vh1.style.width = '5px';
	vh1.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
	vh1.addEventListener('mousedown',vsheetInitiateResize);
	//vh1.addEventListener(vsheetInitiateResize);
	vh.appendChild(vh1);

	var vh2 = document.createElement('div');
	vh2.style.padding = '10px 10px 10px 5px';
	vh2.textContent = 'Sheets';
	vh.appendChild(vh2);

	var vh3 = document.createElement('div');
	vh3.setAttribute('id','vert-close');
	vh3.style.width = "100%";
	vh3.style.direction = 'rtl';
	vh3.style.padding = '10px 0';
	vh3.style.cursor = 'pointer';
	vh3.innerHTML = '&nbsp; x &nbsp;';
	vh.appendChild(vh3);

	//Note, I made a content area in case we add more than just the links ...
	var vc = document.createElement('div');
	vc.setAttribute('id','vert-content');
	vc.style.width = '100%';
	vr.appendChild(vc);

	var jlc = document.createElement('div');
	jlc.setAttribute('id','jim-links-container');
	jlc.style.overflowY = 'auto'; //scroll on vertical overflow
	jlc.style.overflowX = 'hidden';
	jlc.style.height = '300px'; //this will change
	//Top right bottom left
	//TODO: Both borders look bad in overflow or non-overflow case
	//double border on bottom on overflow
	//double border on right when no overflow
	jlc.style.borderWidth = '0 1px 1px 0';
	jlc.style.borderStyle = 'solid';
	jlc.style.boxSizing = 'border-box';
	jlc.style.direction = 'ltr';
	jlc.addEventListener("mousedown",vsheetJimLinksClickCallback)

	vc.appendChild(jlc);

	//var sidebar = div_tag.firstChild;
	var bodyTag = document.getElementsByTagName('body')[0];
	bodyTag.appendChild(vs);

	var moveBar = document.createElement('div');
	moveBar.setAttribute('id','vsheet-move-bar')
	moveBar.style.backgroundColor = '#44ddff';
	moveBar.style.width = '3px';
	moveBar.style.height = '100px';
	moveBar.style.position = 'absolute';
	moveBar.style.display = 'none';

	bodyTag.appendChild(moveBar);


	close = document.getElementById('vert-close');
	close.addEventListener("click", hideSidebar);
}

function hideSidebar(){
	div = document.getElementById('vert-sidebar');
	div.style.display = 'none';
}

function showSidebar(){
	div = document.getElementById('vert-sidebar');
	//div.style.display = null;
	div.style.display = 'flex';
}

function vsheetJimLinksClickCallback(event){
	//This is the main callback for clicks on the vsheet tags
	//
	//Currently calls are either for resizing or clicking a sheet to navigate
	//vsheet-left
	//vsheet-right
	var target = event.target;
	if (target.classList.contains('vsheet-right')){
		switchToActive(target.parentNode);
		clickSheet(target.textContent);
	}else if (target.classList.contains('vsheet-left')){
		//Resize call
		vsheetInitiateResize(event);
		event.preventDefault();
	}else{
		console.log('CODE FAILURE: unexpected tag option for callback')
	}
}

var startResizeX;
var xLeftMax, xRightMax;

var sidebarMinWidth = 80;
var sidebarMaxWidth = 500;

var moveFunction;

function vsheetInitiateResize(event){
	startResizeX = event.clientX;

	var moveBar = document.getElementById('vsheet-move-bar');
	var sidebar = getSidebarTag();
	//top = ?
	//left = ?
	moveBar.style.top = sidebar.style.top;
	moveBar.style.left = window.getComputedStyle(sidebar).left;
	moveBar.style.height = window.getComputedStyle(sidebar).height;

	var sidebar = getSidebarTag();
	var currentWidth = sidebar.offsetWidth;

	var maxGrow = sidebarMaxWidth - currentWidth;
	var maxShrink = sidebarMinWidth - currentWidth;
	var startLeft = parseInt(moveBar.style.left,10);

	//Assignment to global so we can remove later ...
	moveFunction = function(event){vsheetMidResize(event,moveBar,maxGrow,maxShrink,startLeft)};

	document.addEventListener('mousemove', moveFunction, false);
	document.addEventListener('mouseup', vsheetFinalizeResize, false);

	moveBar.style.display = null;
}

var sidebarMinWidth = 80;
var sidebarMaxWidth = 500;

function vsheetMidResize(event,moveBar,maxGrow,maxShrink,startLeft){

	//TODO: Consider adjusting width because

	//Draw moving line
	var endResizeX = event.clientX;
	//Start to right, end left, value will be positive
	//Start left, go to right, value will be negative
	var amountMove = startResizeX - endResizeX;
	//Consider changing color if we hit the limits ...
	if (amountMove > maxGrow){
		amountMove = maxGrow;
	}else if(amountMove < maxShrink){
		amountMove = maxShrink;
	}

	//Consider adjusting width

	moveBar.style.left = "" + (startLeft - amountMove) + "px";
	event.preventDefault();
}

function vsheetFinalizeResize(event){
	var endResizeX = event.clientX;
	var amountMove = startResizeX - endResizeX;
	var sidebar = getSidebarTag();
	var newWidth = amountMove + sidebar.offsetWidth;

	if (newWidth < sidebarMinWidth){
		newWidth = sidebarMinWidth;
	}else if (newWidth > sidebarMaxWidth){
		newWidth = sidebarMaxWidth;
	}

	//Hide the move bar
	var moveBar = document.getElementById('vsheet-move-bar')
	moveBar.style.display = 'none';

	//Update the width of the sidebar ...
	sidebar.style.width = "" + newWidth + "px";

	document.removeEventListener('mousemove', moveFunction, false);
	document.removeEventListener('mouseup', vsheetFinalizeResize, false);
}


//#endregion


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//						Sidebar Sheet Actions
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Sidebar sheet actions

function moveVSheetUp(tag){
	if (tag) {
		var parent = getVSheetsHolder();
		parent.insertBefore(tag, tag.previousElementSibling)
	}
}
function moveVSheetDown(tag){
	if (tag) {
		var parent = getVSheetsHolder();
		parent.insertBefore(tag.nextElementSibling, tag);
	}
}

function getVSheetsHolder(){
	return document.getElementById('jim-links-container');
}

function getVSheetByName(sheetName){
	return document.getElementById('sidebar-' + sheetName);
}

function switchToActive(tag){
	//Only changes things visually ...
	removeActive();
	setActive(tag);
}

function setActive(tag){
	if (tag){
		tag.style.backgroundColor = "#FFF";
		tag.style.color = "#188038";
		tag.style.cursor = "default";
		activeTag = tag;
	}
}

function removeActive(){
	if (activeTag){
		activeTag.style.backgroundColor = '#f1f3f4';
		activeTag.style.color = 'black';
		activeTag.style.cursor = "pointer";
		activeTag = null;
	}
}


//#endregion

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//						Sidebar Moving
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Sidebar Moving/Resizing

function hideOrShowMenus(){
	resizeSidebar("menu");
}

function resizeSidebar(type){
// Reasons for resizing include:
//
// - initialization 'init'
// - toggleMenuVisibility 'menu'
// - resizing

	var gridScrollDiv = document.querySelector('.grid-scrollable-wrapper');
	var companionDiv = document.querySelector('.docs-companion-app-switcher-container');
	switch (type){
		case 'init':
			menuIsHidden = false;
			sideIsHidden = companionDiv.offsetWidth == 0;
			//TODO: populate sideIsHidden
			gridHeight = gridScrollDiv.offsetHeight;
			sidePanelWidth = companionDiv.offsetWidth;
			resizeSidebarHelper();
			break;
		case 'menu':
			menuIsHidden = !menuIsHidden;
			//fall through
		case 'resize':
			resizeSideberHelperWaitForGrid(gridScrollDiv,gridHeight,0);
			break;
		case 'side':
			sideIsHidden = !sideIsHidden;
			resizeSideberHelperWaitForSideCompanion(companionDiv,sidePanelWidth,0);
			break;
	}
}

function resizeSideberHelperWaitForSideCompanion(compTag,target,i){
	if (compTag.offsetWidth != target){
		sidePanelWidth = compTag.offsetWidth;
		resizeSidebarHelper();
	}else{
		if (i+1 > 10){
			resizeSidebarHelper();
		}else{
			setTimeout(function() { resizeSideberHelperWaitForSideCompanion(compTag,target,i+1); }, 200);
		}
	}
}

function resizeSideberHelperWaitForGrid(gridTag,target,i){
	if (gridTag.offsetHeight != target){
		gridHeight = gridTag.offsetHeight;
    	resizeSidebarHelper();
  	}else{
  		if (i+1 > 10){
      		resizeSidebarHelper();
  		}else{
  	  		setTimeout(function() { resizeSideberHelperWaitForGrid(gridTag,target,i+1); }, 200);
  		}
  	}
}

function resizeSidebarHelper(){

	//This should only be called once everything is ready (sized properly)

	var docsBrandingContainer = document.getElementById('docs-branding-container');
	var toolBar = document.getElementById('docs-toolbar-wrapper');
	var formulaBar = document.getElementById('formula-bar');

	var y1 = docsBrandingContainer.offsetHeight;
	var y2 = toolBar.offsetHeight;
	var y3 = formulaBar.offsetHeight;

	//console.log('Y values')
	//console.log(y1)
	//console.log(y2)
	//console.log(y3)

	//Needed for x1
	var companionBar = document.querySelector('.docs-companion-app-switcher-container');
	var yScroll = document.querySelector('.native-scrollbar-y');

	//console.log('X values')
	var x1 = companionBar.offsetWidth;
	var x2 = yScroll.offsetWidth;

	//console.log(x1);
	//console.log(x2);

	//console.log('gridHeight')
	//console.log(gridHeight);
	//console.log('sidePanelWidth')
	//console.log(sidePanelWidth);


	var top = y1 + y2 + y3;
	var right = x1 + x2;

	var sidebarHeader = document.getElementById('vert-header')

	//What is this? I think this is the height of the grid row labels A, B, C, etc.
	var rowHeader = document.querySelector('.fixed-table-container')

	var gridScrollDiv = document.querySelector('.grid-scrollable-wrapper')

	var hleft1 = gridScrollDiv.offsetHeight;
	var hleft2 = rowHeader.offsetHeight;

	var hright1 = sidebarHeader.offsetHeight;
	var hright2 = hleft1 + hleft2 - hright1;

	var sideBar = document.getElementById('vert-sidebar');
	sideBar.style.top = top + "px";
	sideBar.style.right = right + "px";

	var sideContent = document.getElementById('jim-links-container');
	sideContent.style.height = (hright2) + "px";

}

function windowResized(){
	resizeSidebar('resize');
}

//#endregion


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//                    Bottom Horizontal Sheet Code
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Bottom HSheet Code

/*
<div class="docs-sheet-button-bar goog-toolbar goog-inline-block" role="toolbar" style="user-select: none;">
   <div class="docs-sheet-button goog-inline-block docs-sheet-add" tabindex="0" data-tooltip="Add Sheet" aria-label="Add Sheet" role="button" id=":f" style="user-select: none;">
      <div class="goog-inline-block docs-sheet-button-outer-box" style="user-select: none;">
         <div class="goog-inline-block docs-sheet-button-inner-box" style="user-select: none;">
            <div class="goog-inline-block docs-icon docs-sheet-button-icon" style="user-select: none;">&nbsp;</div>
         </div>
      </div>
   </div>
   <div class="docs-sheet-menu-button goog-inline-block docs-sheet-all docs-sheet-button" tabindex="0" data-tooltip="All Sheets" aria-label="All Sheets" role="button" aria-expanded="false" aria-haspopup="true" id=":g" style="user-select: none;">
      <div class="goog-inline-block docs-sheet-button-outer-box" style="user-select: none;">
         <div class="goog-inline-block docs-sheet-button-inner-box" style="user-select: none;">
            <div class="goog-inline-block docs-icon docs-sheet-button-icon" style="user-select: none;">&nbsp;</div>
         </div>
      </div>
   </div>
</div>


 */
function addSheetCalled(){
	var hSheet = getHSheetByVSheet(activeTag);
	if (hSheet) {
		waitUntilNotActiveSheet(0, hSheet, respondToAddSheet);
	}
}

function waitUntilNotActiveSheet(i,tag,fcn){
	if (tag.classList.contains(ACTIVE_SHEET_TAB_CLASS)){
		if (i < 20) {
			setTimeout(function () {
				waitUntilNotActiveSheet(i+1, tag, fcn)
			},200)
		}else{
			console.log('TIMEOUT FAILURE for ' + 'waitUntilNotActiveSheet');
		}
	}else{
		fcn(tag);
	}
}

//This might belong in the vsheets section
function respondToAddSheet(hsheetLastActiveTag){
	//oldVSheetTag = getVSheetByName()
	var hsheetActiveTag = document.querySelector('.' + ACTIVE_SHEET_TAB_CLASS);

	//We might make all of this a function
	//get sheet name from hSheet - handles this nav if necessary ...
	var nameTag = hsheetActiveTag.querySelector('.docs-sheet-tab-name');
	var sheetName = nameTag.textContent;

	var newTag = createVSheetTag(sheetName)
	activeTag.parentNode.insertBefore(newTag, activeTag.nextSibling);
	switchToActive(newTag);
}

function getHSheetByVSheet(vSheet){
	//Right now this could be either for the right portion or the parent

	if (vSheet.classList.contains('vsheet-main')){
		vSheet = vSheet.querySelector('.vsheet-right');
	}

	//vsheet-right
	var sheetName = vSheet.textContent;
	return getHSheetByName(sheetName,2);
}

//Could have multiple functions
//HSheetSpanByName
//HSheetRootByName
function getHSheetByName(sheetName,type){
	//Do we want:
	//1) the span with the name
	//2) the root tag ...
	//docs-sheet-tab
	var sheetElements = document.getElementsByClassName('docs-sheet-tab-name')
	for (var i = 0; i < sheetElements.length; i++) {
		if (sheetElements[i].textContent == sheetName){
			if (type == 1) {
				return sheetElements[i];
			}else{
				return closestClass(sheetElements[i],'docs-sheet-tab')
			}
		}
	}
	return null;
}

function clickSheet(sheetName){

//   In this approach we click on the <div> tags that are in a container
//   that pops up when you click on the all sheets list. An alternative
//	 approach is to just click on the sheets themselves. I didn't try
//   that approach because I was worried that clicking might fail if
//	 the sheet was not visible.

	var hSheet = getHSheetByName(sheetName,1);
	if (hSheet){
		fakeClick(hSheet);
	}

}

function sheetMenuPopupSelected(event){

	var action = event.target.innerText.toLowerCase();
	switch (action){
		case 'move left':
			moveVSheetUp(activeTag);
			break;
		case 'move right':
			moveVSheetDown(activeTag);
			break;
		case 'delete':
			//NYI
			break;
	}
	//event.target.innerText

	//Delete
	//Duplicate
	//Rename - hard to handle ... - not sure how to register event
	//X Move Left
	//X Move Right

	//This doesn't work because we are racing ...
	//
	//Need to handle actual instruction ...
	//
	//- move left
	//- move right
	//- delete
	//- rename

	//Hack for now ... - won't work for rename ...
	//setTimeout(populateNavLinks,1000);

	//populateNavLinks();
}

/*
 * Initalizes the listener/callback function for the menu popup that gets shown
 * when right clicking on one of the sheet names at the bottom
 */
function initializeSheetMenuListener(){
  //Note this value is somewhat arbitrary. How long does it take for the 
  //popup to exist after right click? Normally I would assume this happens
  //in less than 1 second.
  var maxWaitTime = 5; //seconds
  callAfterClassIsValid('docs-sheet-tab-menu',maxWaitTime,initializeSheetMenuListener2);
}

function initializeSheetMenuListener2(menu){
  menu.addEventListener("mousedown",sheetMenuPopupSelected);
  
  //It seems like the menu may not be persistent, so we need to initialize the listener each time
  //We'll keep the global and logic in for now in case this changes
  //sheetMenuListenerInitialized = true;
}

function sheetSelected(event){

  //left click
  //   - make sheet active
  //   - bring out dropdown if on active sheet already
  //right click
  //   - make active and show menu
  
  
  //0 - left click
  //2 - right click
  //1 - middle? what happens then?
  
  //if (event.button == 0){
  	//0 - left click
  	 var tag = event.target;
  	 //console.log(tag)
  	   	 
  	 if (tag.classList.contains('docs-sheet-tab-dropdown')
  	 	|| tag.classList.contains('docs-icon-arrow-dropdown')){
  	 	//menu click on active sheet - name not valid
  	 	//Note - this could close if the menu is currently visible ...
  	 	if (!sheetMenuListenerInitialized){
  	 	   initializeSheetMenuListener();
  	 	}
  	 }else{
  	 	 //Unfortunately it is possible to click on things that are not the span with the name
  	 	 //Noteably : <div class="docs-sheet-tab-color" style="background: transparent;"></div>
  	 	 //We could hard code in this check, but I am going to just go to the parent and look down
  	     tag = closestClass(tag,"docs-sheet-tab");
  	     //If we use textContent we sometimes get a hidden leading 0
  	     var sheetName = tag.innerText;
  	     //console.log(sheetName)
		 var vsheetTag = getVSheetByName(sheetName);
  	     //console.log(sidebarTag)

		 switchToActive(vsheetTag);

	     if (event.button == 2 && !sheetMenuListenerInitialized){
	       initializeSheetMenuListener();
	     }
  	 }
  	 

  //}
  
  //note a right click makes it active
  
  //TODO: Handle the right click menu
  //- rename
  //- delete
  //- reorder
  //
  //For now the simplest would be to register a listener on the menu
  //then redraw the sidebar
  
  
  //button = 2 - right click menu shown
  //button = 1 - left click - change sheet
  //srcElement
  //target
  //toElement
}

/*
 *  This callback gets called
 *
 */

//#endregion



//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//                             Add-On Menu Code
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Add-On Menu

//TODO: Create wait until exists for menu

/*
//The Add on button that launches the menus
//
<div id="docs-extensions-menu" role="menuitem" class="menu-button goog-control goog-inline-block"
 	aria-disabled="false" aria-expanded="false" aria-haspopup="true" style="user-select: none;">
 		Add-ons</div>


//The menu container
//-----------------------------------------------------------
<div class="goog-menu goog-menu-vertical docs-material goog-menu-noaccel docs-menu-hide-mnemonics"
		role="menu" aria-haspopup="true" style="user-select: none; visibility: visible;
		left: 388.108px; top: 61.9826px; display: none;">
   <div class="goog-menuitem apps-menuitem" role="menuitem" aria-disabled="false"
   		id="5xq0ya:123" style="user-select: none;">
      <div id="vert-tab-div-menu">
      	<span aria-label="Launch Vert Tabs" class="goog-menuitem-label">Launch Vert Tabs</span></div>
   </div>
   <div class="goog-menuseparator" aria-disabled="true" role="separator" id="9xhfa2:2qd" aria-hidden="true" style="user-select: none; display: none;"></div>

//Example menu item
//-----------------------------------------------------------
<div class="goog-menuitem goog-menuitem-disabled apps-menuitem" role="menuitem"
		aria-disabled="true" id="9xhfa2:2qi" style="user-select: none;">
	<div class="goog-menuitem-content"><span aria-label="Manage add-ons m"
		class="goog-menuitem-label">
			<span class="goog-menuitem-mnemonic-hint">M</span>anage add-ons</span>
	</div>
</div>
*/

//goog-menuitem 2012
//goog-menuitem-mnemonic-hint 194 - to specific, would only give M
//goog-menuitem-label 177
//goog-menuitem-content 693
//apps-menuitem 223

function delayUntilValidAddOnMenu(){

	var TIMEOUT = 20; //20 second timeout
	var pauseDuration = 200;
	var nMax = Math.ceil(TIMEOUT*1000/pauseDuration);
	delayUntilValidAddOnMenuHelper(0,nMax,pauseDuration)
}

function delayUntilValidAddOnMenuHelper(i,nMax,pauseDuration){
	//
	//	wait until "manage addd-ons" is valid then create our menu option

	var menuItems = document.getElementsByClassName('goog-menuitem-label');
	var result = Array.from(menuItems).find(tag => tag.textContent == 'Manage add-ons');
	if (result){
		createMenu(result)
	}else{
		if (i+1 > nMax) {
			console.log('TIMEOUT FAILURE - Failed to create menu, timed out')
		}else{
			setTimeout(function(){delayUntilValidAddOnMenuHelper(i+1,nMax,pauseDuration)},pauseDuration)
		}

	}
	//Array.from(menu_items).find
	//    res = Array.from(elems).find(v => v.textContent == 'Special');

}



function createMenu(menuTag){

	var menuHolder = closestClass(menuTag,'goog-menu');

	var temp = document.createElement('div');
	temp.innerHTML = '' +
		'<div class="goog-menuitem apps-menuitem" role="menuitem" ' +
		    'aria-disabled="false" style="user-select: none;">' +
		    '<div id="vert-tab-div-menu">' +
		        '<span aria-label="Launch Vert Tabs" class="goog-menuitem-label">' +
			    'Launch Vert Tabs</span>' +
			'</div>' +
		'</div>';
	var menuDiv = temp.firstChild;

	//TODO: I'm not really sure if this is needed or what I should set it too
	//Does this impact menu ordering?
	menuDiv.setAttribute('id','5xq0ya:123');
	menuHolder.appendChild(menuDiv);

	//docs-menu-attached-button-above
	//display none
	menuDiv.addEventListener("mousedown",function(){
		menuHolder.classList.remove("docs-menu-attached-button-above");
		menuHolder.style.display = "none";
		launchSideBar();
	});
	menuDiv.addEventListener("mouseover",function(){
		menuDiv.classList.add("goog-menuitem-highlight");
	});
	menuDiv.addEventListener("mouseout",function(){
		menuDiv.classList.remove("goog-menuitem-highlight");
	});

}


//#endregion


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//                                Main Function
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Main
var vertSheetsMain;
(vertSheetsMain = function vertSheetInitializer(){
    //TODO: Instead just check periodically and delay if necessary
    //setTimeout(function() { createMenu(); }, 8000);

	var TIMEOUT = 20;

    delayUntilValidAddOnMenu()
  
    createSidebar();
  
    //The view mode button toggles between hiding and showing the menus. When the menus are hidden
    //sheets move up and to the right. The rightward movement is from hiding the Google Apps menu (calendar, tasks, & keep).
    var viewModeButton = document.getElementById('viewModeButton');
    viewModeButton.addEventListener("mousedown",hideOrShowMenus);

    //var sidePanelButton = document.querySelector('.companion-collapser-button-container');

	callAfterClassIsValid('companion-collapser-button',TIMEOUT,registerSideListen)
    // var companionSideButton = document.querySelector('.companion-collapser-button');
    // console.log(companionSideButton);
	// companionSideButton.addEventListener("mousedown",function(){resizeSidebar("side")});
  	//
    window.addEventListener("resize", windowResized);

	var addSheetButton = document.querySelector('.docs-sheet-add');
	addSheetButton.addEventListener('mousedown',addSheetCalled);

	//TODO: Handle all sheet selection button
  
    var sheetContainer = document.querySelector('.docs-sheet-container-bar');
    sheetContainer.addEventListener("mousedown", sheetSelected);
})();

function registerSideListen(){

	//Log width so when we toggle we know where we were so we can wait for a change
	var companionSidePanel = document.querySelector('.companion-app-switcher-container');
	sidePanelWidth = companionSidePanel.offsetWidth;

	var companionSideButton = document.querySelector('.companion-collapser-button');
	companionSideButton.addEventListener("mousedown",function(){resizeSidebar("side")});

}

//#endregion

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//                                Utils
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

//#region Utils

function fakeClick(el) {
	//https://stackoverflow.com/questions/61090920/click-all-sheets-in-google-sheets-using-chrome-extension/61091451#61091451
	el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
}


//https://stackoverflow.com/questions/23925520/javascript-traverse-dom-until-class-is-reached
function closestClass(el, cls) {
  while (el  && el !== document) {
      if (el.classList.contains(cls)) return el;
      el = el.parentNode;
  }
  return null;
}

function callAfterClassIsValid(className,timeout,fcn){
//timeout in s
//.docs-sheet-tab-menu
var pauseDuration = 200;
var nMax = Math.ceil(timeout*1000/pauseDuration);

var target = '.' + className;

callAfterClassIsValidHelper(target,nMax,0,fcn)
}

function callAfterClassIsValidHelper(target,nMax,i,fcn,pauseDuration){
 tag = document.querySelector(target);
 if (tag){
    return fcn(tag);
 }else{
   i = i + 1;
   if (i > nMax){
     //Then what ...
   }else{
     setTimeout(function(){callAfterClassIsValidHelper(target,nMax,i,fcn,pauseDuration)},pauseDuration);
   }
 }
}

//#endregion
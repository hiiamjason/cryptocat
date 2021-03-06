// Cryptocat templates for use with mustache.js.
'use strict';

Cryptocat.templates = {

	customServer: '<option data-domain="{{domain}}" data-xmpp="{{XMPP}}" data-relay="{{Relay}}">'
		+ '{{name}}</option>',

	generatingKeys: '<br /><p id="progressForm"><img src="img/keygen.gif" '
		+ 'alt="" /><p id="progressInfo"><span>{{text}}</span></p>',

	catFact: '<br />Here is an interesting fact while you wait:'
		+ '<br /><div id="interestingFact">{{catFact}}</div>',

	buddy: '<div class="buddy" id="buddy-{{buddyID}}" status="online" data-nickname="{{nickname}}" data-id="{{buddyID}}" dir="ltr">'
		+ '<span>{{shortNickname}}</span>'
		+ '<div class="buddyMenu" id="menu-{{buddyID}}"></div></div>',

	buddyMenu: '<div class="buddyMenuContents" id="{{buddyID}}-contents">'
		+ '<li class="option1">{{displayInfo}}</li>'
		+ '<li class="option3">{{ignore}}</li>'
		+ '</div>',

	myInfo: '<div class="title">{{nickname}}</div>'
		+ '<div id="displayInfo">'
		+ '{{groupFingerprint}}<br /><span id="multiPartyFingerprint"></span><br />'
		+ '{{otrFingerprint}}<br /><span id="otrFingerprint"></span></div>',

	errorAKE: '<div class="title errorTitle">{{nickname}}</div>'
		+ '<div id="displayInfo">'
		+ '{{errorText}}<br />'
		+ '<input type="button" id="openAuth" value="{{openAuth}}" />'
		+ '</div>',

	buddyInfo: '<div class="title">{{nickname}}</div>'
		+ '<div id="displayInfo">'
		+ '<span id="authenticated">Authenticated</span><span id="notAuthenticated">Not Authenticated</span><br />'
		+ '<span id="authLearnMore">Learn more about authentication</span><br />'
		+ '<div class="authInfo" style="height:95px">{{groupFingerprint}}<br />'
		+ '<span id="multiPartyFingerprint"></span><br />'
		+ '{{otrFingerprint}}<br /><span id="otrFingerprint"></span></div>'
		+ '<div class="authInfo authSMP"><span>{{verifyUserIdentity}}</span><br /><br />'
		+ '<form><input type="text" id="authQuestion" placeholder="{{secretQuestion}}" maxlength="64" />'
		+ '<input type="password" id="authAnswer" placeholder="{{secretAnswer}}" maxlength="64" />'
		+ '<input id="authSubmit" type="submit" value="{{ask}}" /></form>'
		+ '<p id="authVerified">{{identityVerified}}</p></div>'
		+ '<div id="authTutorial"></div></div>',

	authTutorial: '<div id="authTutorialSlides"><ul class="bjqs">'
		+ '<li><img src="img/authTutorial/1.png" title="{{slide1}}"></li>'
		+ '<li><img src="img/authTutorial/2.png" title="{{slide2}}"></li>'
		+ '<li><img src="img/authTutorial/3.png" title="{{slide3}}"></li>'
		+ '<li><img src="img/authTutorial/4.png" title="{{slide4}}"></li>'
		+ '</ul></div>',

	authRequest: '<div class="title">{{authenticate}}</div>'
		+ '<p>{{authRequest}}<br />'
		+ '<strong>{{question}}</strong><br /><br />'
		+ '<form id="authReplyForm"><input id="authReply" type="password" placeholder="{{secretAnswer}}" maxlength="64" />'
		+ '<input id="authReplySubmit" type="submit" value="{{answer}}" /></form></p>'
		+ '<p>{{answerMustMatch}}</p>',

	sendFile: '<div class="title">{{sendEncryptedFile}}</div>'
		+ '<input type="file" id="fileSelector" name="file[]" />'
		+ '<input type="button" id="fileSelectButton" value="{{sendEncryptedFile}}" />'
		+ '<div id="fileInfoField">{{fileTransferInfo}}</div>',

	file: '<div class="fileProgressBar" file="{{message}}"><div class="fileProgressBarFill"></div></div>',

	fileLink: '<a href="{{url}}" class="fileView" target="_blank" download="{{filename}}">{{downloadFile}}</a>',

	fileLinkMac: '<a href="{{url}}" class="fileView" download="{{filename}}">{{downloadFile}}</a>',

	missingRecipients: '<div class="missingRecipients">{{text}}</div>',

	message: '<div class="line{{lineDecoration}}"><span class="sender" data-sender="{{nickname}}"'
		+ ' data-timestamp="{{currentTime}}"><span class="authStatus" data-auth="{{authStatus}}" '
		+ 'data-utip-gravity="se"></span>'
		+ '<span class="nickname">{{nickname}}</span></span>{{&message}}</div>',

	authStatusFalseUtip: '<div id="authStatusUtip">{{text}}<br /><strong>{{learnMore}}</strong></div>',

	composing: '<img src="img/typing.gif" class="typing" id="{{id}}" alt="" />',

	userJoin: '<div class="userJoin"><span class="timestamp">{{currentTime}}</span>'
		+ '<strong>+</strong>{{nickname}}</div>',

	userLeave: '<div class="userLeave"><span class="timestamp">{{currentTime}}</span>'
		+ '<strong>-</strong>{{nickname}}</div>'

}

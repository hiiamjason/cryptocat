Cryptocat.multiParty = function() {};

(function(){
'use strict';

var usedIVs = []

var correctIvLength = function(iv){
	var ivAsWordArray = CryptoJS.enc.Base64.parse(iv)
	var ivAsArray = ivAsWordArray.words
	ivAsArray.push(0)  // adds 0 as the 4th element, causing the equivalent
					   // bytestring to have a length of 16 bytes, with
					   // \x00\x00\x00\x00 at the end.
					   // without this, crypto-js will take in a counter of
					   // 12 bytes, and the first 2 counter iterations will
					   // use 0, instead of 0 and then 1.
					   // see https://github.com/cryptocat/cryptocat/issues/258
	return CryptoJS.lib.WordArray.create(ivAsArray)
}

// AES-CTR-256 encryption
// No padding, starting IV of 0
// Input: WordArray, Output: Base64
// Key input: WordArray
var encryptAES = function(msg, c, iv) {
	var opts = {
		mode: CryptoJS.mode.CTR,
		iv: correctIvLength(iv),
		padding: CryptoJS.pad.NoPadding
	}
	var aesctr = CryptoJS.AES.encrypt(
		msg,
		c,
		opts
	)
	return aesctr.toString()
}

// AES-CTR-256 decryption
// No padding, starting IV of 0
// Input: Base64, Output: WordArray
// Key input: WordArray
var decryptAES = function(msg, c, iv) {
	var opts = {
		mode: CryptoJS.mode.CTR,
		iv: correctIvLength(iv),
		padding: CryptoJS.pad.NoPadding
	}
	var aesctr = CryptoJS.AES.decrypt(
		msg,
		c,
		opts
	)
	return aesctr
}

// HMAC-SHA512
// Output: Base64
// Key input: WordArray
var HMAC = function(msg, key) {
	return CryptoJS.HmacSHA512(
		msg, key
	).toString(CryptoJS.enc.Base64)
}

// Generate private key (32 random bytes)
// Represented as BigInt
Cryptocat.multiParty.genPrivateKey = function() {
	return BigInt.randBigInt(256)
}

// Generate public key (Curve 25519 Diffie-Hellman with basePoint 9)
// Represented as BigInt
Cryptocat.multiParty.genPublicKey = function(privateKey) {
	return Curve25519.ecDH(privateKey)
}

// Generate shared secrets
// First 256 bytes are for encryption, last 256 bytes are for HMAC.
// Represented as WordArrays
Cryptocat.multiParty.genSharedSecret = function(nickname) {
	//I need to convert the BigInt to WordArray here. I do it using the Base64 representation.
	var sharedSecret = CryptoJS.SHA512(
		CryptoJS.enc.Base64.parse(
			BigInt.bigInt2base64(
				Curve25519.ecDH(
					Cryptocat.me.mpPrivateKey,
					Cryptocat.buddies[nickname].mpPublicKey
				),
				32
			)
		)
	)
	return {
		'message': CryptoJS.lib.WordArray.create(sharedSecret.words.slice(0, 8)),
		'hmac': CryptoJS.lib.WordArray.create(sharedSecret.words.slice(8, 16))
	}
}

// Get fingerprint
// If nickname is null, returns own fingerprint
Cryptocat.multiParty.genFingerprint = function(nickname) {
	var key = Cryptocat.me.mpPublicKey
	if (nickname) {
		key = Cryptocat.buddies[nickname].mpPublicKey
	}
	return CryptoJS.SHA512(
		CryptoJS.enc.Base64.parse(
			BigInt.bigInt2base64(key, 32)
		)
	).toString().substring(0, 40).toUpperCase()
}

// Send my public key in response to a public key request.
Cryptocat.multiParty.sendPublicKey = function(nickname) {
	var answer = {}
	answer['type'] = 'publicKey'
	answer['text'] = {}
	answer['text'][nickname] = {}
	answer['text'][nickname]['message'] = BigInt.bigInt2base64(
		Cryptocat.me.mpPublicKey, 32
	)
	return JSON.stringify(answer)
}

// Issue a warning for decryption failure to the main conversation window
Cryptocat.multiParty.messageWarning = function(sender) {
	var messageWarning = Cryptocat.locale['warnings']['messageWarning']
		.replace('(NICKNAME)', sender)
	Cryptocat.addToConversation(messageWarning, sender, 'main-Conversation', 'warning')
}

// Generate message tag. 8 rounds of SHA512
// Input: WordArray
// Output: Base64
Cryptocat.multiParty.messageTag = function(message) {
	for (var i = 0; i !== 8; i++) {
		message = CryptoJS.SHA512(message)
	}
	return message.toString(CryptoJS.enc.Base64)
}

// Send message.
Cryptocat.multiParty.sendMessage = function(message) {
	//Convert from UTF8
	message = CryptoJS.enc.Utf8.parse(message)
	// Add 64 bytes of padding
	message.concat(Cryptocat.random.rawBytes(64))
	var encrypted = {
		text: {},
		type: 'message'
	}
	//Sort recipients
	var sortedRecipients = []
	for (var b in Cryptocat.buddies) {
		if (Cryptocat.buddies[b].mpSecretKey) {
			sortedRecipients.push(b)
		}
	}
	sortedRecipients.sort()
	var hmac = CryptoJS.lib.WordArray.create()
	//For each recipient
	var i, iv
	for (i = 0; i !== sortedRecipients.length; i++) {
		//Generate a random IV
		iv = Cryptocat.random.encodedBytes(12, CryptoJS.enc.Base64)
		// Do not reuse IVs
		while (usedIVs.indexOf(iv) >= 0) {
			iv = Cryptocat.random.encodedBytes(12, CryptoJS.enc.Base64)
		}
		usedIVs.push(iv)
		//Encrypt the message
		encrypted['text'][sortedRecipients[i]] = {}
		encrypted['text'][sortedRecipients[i]]['message'] = encryptAES(
			message,
			Cryptocat.buddies[sortedRecipients[i]].mpSecretKey['message'],
			iv
		)
		encrypted['text'][sortedRecipients[i]]['iv'] = iv
		//Append to HMAC
		hmac.concat(CryptoJS.enc.Base64.parse(encrypted['text'][sortedRecipients[i]]['message']))
		hmac.concat(CryptoJS.enc.Base64.parse(encrypted['text'][sortedRecipients[i]]['iv']))
	}
	encrypted['tag'] = message.clone()
	//For each recipient again
	for (i = 0; i !== sortedRecipients.length; i++) {
		//Compute the HMAC
		encrypted['text'][sortedRecipients[i]]['hmac'] = HMAC(
			hmac,
			Cryptocat.buddies[sortedRecipients[i]].mpSecretKey['hmac']
		)
		//Append to tag
		encrypted['tag'].concat(CryptoJS.enc.Base64.parse(encrypted['text'][sortedRecipients[i]]['hmac']))
	}
	//Compute tag
	encrypted['tag'] = Cryptocat.multiParty.messageTag(encrypted['tag'])
	return JSON.stringify(encrypted)
}

// Receive message. Detects requests/reception of public keys.
Cryptocat.multiParty.receiveMessage = function(sender, myName, message) {
	try {
		message = JSON.parse(message)
	}
	catch(err) {
		console.log('multiParty: failed to parse message object')
		return false
	}
	if (typeof(message['text'][myName]) === 'object') {
		// Detect public key reception, store public key and generate shared secret
		if (message['type'] === 'publicKey') {
			if (typeof(message['text'][myName]['message']) !== 'string') {
				console.log('multiParty: publicKey without message field')
				return false
			}
			if (!Cryptocat.buddies[sender].mpPublicKey) {
				var publicKey = BigInt.base642bigInt(message['text'][myName]['message'])
				Cryptocat.buddies[sender].mpPublicKey   = publicKey
				Cryptocat.buddies[sender].mpFingerprint = Cryptocat.multiParty.genFingerprint(sender)
				Cryptocat.buddies[sender].mpSecretKey   = Cryptocat.multiParty.genSharedSecret(sender)
				Cryptocat.xmpp.sendPublicKey(sender)
			}
			return false
		}
		// Detect public key request and send public key
		else if (message['type'] === 'publicKeyRequest') {
			Cryptocat.xmpp.sendPublicKey(sender)
		}
		else if (message['type'] === 'message') {
			// Make sure message is being sent to all chat room participants
			var recipients = Object.keys(Cryptocat.buddies)
			var missingRecipients = []
			recipients.splice(recipients.indexOf('main-Conversation'), 1)
			recipients.splice(recipients.indexOf(sender), 1)
			for (var r = 0; r !== recipients.length; r++) {
				try {
					if (typeof(message['text'][recipients[r]]) === 'object') {
						var noMessage = typeof(message['text'][recipients[r]]['message']) !== 'string'
						var noIV = typeof(message['text'][recipients[r]]['iv']) !== 'string'
						var noHMAC = typeof(message['text'][recipients[r]]['hmac']) !== 'string'
						if (noMessage || noIV || noHMAC) {
							missingRecipients.push(recipients[r])
						}
					}
					else {
						missingRecipients.push(recipients[r])
					}
				}
				catch(err) {
					missingRecipients.push(recipients[r])
				}
			}
			if (missingRecipients.length) {
				Cryptocat.addToConversation(missingRecipients, sender, 'main-Conversation', 'missingRecipients')
			}
			// Decrypt message
			if (!Cryptocat.buddies[sender].mpSecretKey) {
				return false
			}
			// Sort recipients
			var sortedRecipients = Object.keys(message['text']).sort()
			// Check HMAC
			var hmac = CryptoJS.lib.WordArray.create()
			var i
			for (i = 0; i !== sortedRecipients.length; i++) {
				hmac.concat(CryptoJS.enc.Base64.parse(message['text'][sortedRecipients[i]]['message']))
				hmac.concat(CryptoJS.enc.Base64.parse(message['text'][sortedRecipients[i]]['iv']))
			}
			if (message['text'][myName]['hmac'] !== HMAC(hmac, Cryptocat.buddies[sender].mpSecretKey['hmac'])) {
				console.log('multiParty: HMAC failure')
				Cryptocat.multiParty.messageWarning(sender)
				return false
			}
			// Check IV reuse
			if (usedIVs.indexOf(message['text'][myName]['iv']) >= 0) {
				console.log('multiParty: IV reuse detected, possible replay attack')
				Cryptocat.multiParty.messageWarning(sender)
				return false
			}
			usedIVs.push(message['text'][myName]['iv'])
			// Decrypt
			var plaintext = decryptAES(
				message['text'][myName]['message'],
				Cryptocat.buddies[sender].mpSecretKey['message'],
				message['text'][myName]['iv']
			)
			// Check tag
			var messageTag = plaintext.clone()
			for (i = 0; i !== sortedRecipients.length; i++) {
				messageTag.concat(CryptoJS.enc.Base64.parse(message['text'][sortedRecipients[i]]['hmac']))
			}
			if (Cryptocat.multiParty.messageTag(messageTag) !== message['tag']) {
				console.log('multiParty: message tag failure')
				Cryptocat.multiParty.messageWarning(sender)
				return false
			}
			// Remove padding
			if (plaintext.sigBytes < 64) {
				console.log('multiParty: invalid plaintext size')
				Cryptocat.multiParty.messageWarning(sender)
				return false
			}
			plaintext = CryptoJS.lib.WordArray.create(plaintext.words, plaintext.sigBytes-64)
			// Convert to UTF8
			return plaintext.toString(CryptoJS.enc.Utf8)
		}
		else {
			console.log('multiParty: Unknown message type: ' + message['type'])
			Cryptocat.multiParty.messageWarning(sender)
		}
	}
	return false
}

// Reset everything except my own key pair
Cryptocat.multiParty.reset = function() {
	usedIVs = []
}

})()//:3

import {pttChannel} from './testCases'

let currentEndTag = ''
let tree = {tag: 'body', child: null, lastChild: null, preSibling: null, sibling: null, parentNode: {tag: 'html', dom: document.body.parentNode}, dom: document.body, attributeComplete: true}
let currentRoot = tree
let currentLoc = currentRoot
let currentAttribute = ''
let templateIterIndex = 0

function currentLocToParent() {
  currentLoc = currentLoc.parentNode
}
function newChildCurrentLoc(isTextNode=false) {
  const parentNode = currentLoc
  currentLoc = isTextNode ? {type: 'text', tag: '', parentNode, sibling: null, dom: null, innerText: ''}
  :
  {tag: '', parentNode, child: null, lastChild: null, sibling: null, dom: null, attributes: {}}
  if(parentNode.lastChild) {
    parentNode.lastChild.sibling = currentLoc
    currentLoc.preSibling = parentNode.lastChild
    parentNode.lastChild = currentLoc
  } else {
    parentNode.child = parentNode.lastChild = currentLoc
  }
}
function start(c) {
  if(/[\s]/.exec(c)) {
      return start
  }
  if(c === '<') {
      return startTag(c)
  }
}
function startTag(c) {
  if(c === '<') {
      newChildCurrentLoc()
      return startTag
  }
  if(/[A-Za-z]/.exec(c)) {
      currentLoc.tag += c
      return startTag
  }
  if(/[\s]/.exec(c)) {
      if(currentLoc.tag.length) {
          return startTagAttributeName
      }
      return startTag
  }
  if(c === '/') {
      return endTagEnd(c)
  }
  if(c === '>') {
      currentLoc.attributeComplete = true
      return afterStartTag
  }
}
function startTagAttributeName(c) {
  if(/[\s]/.exec(c)) {
      if(currentAttribute.length) {
          currentLoc.attributes[currentAttribute] = ''
          return startTagAttributeBeforeEqualSign
      }
      return startTagAttributeName
  }
  if(/[a-z-]/.exec(c)) {
      currentAttribute += c
      return startTagAttributeName
  }
  if(c === '=') {
      return startTagAttributeBeforeQuote
  }
  if(c === '>') {
      if(currentAttribute.length) {
        currentLoc.attributes[currentAttribute] = true
      }
      currentLoc.attributeComplete = true
      return afterStartTag
  }
  if(c === '/') {
      return endTagEnd
  }
}
function startTagAttributeBeforeEqualSign(c) {
  if(/[\s]/.exec(c)) {
      return startTagAttributeBeforeEqualSign
  }
  if(c === '=') {
      return startTagAttributeBeforeQuote
  }
}
function startTagAttributeBeforeQuote(c) {
  if(/[\s]/.exec(c)) {
      return startTagAttributeBeforeQuote
  }
  if(c === '"') {
      currentLoc.attributes[currentAttribute] = ""
      return startTagAttributeValue
  }
}
function startTagAttributeValue(c) {
  if(c === '"') {
      currentAttribute = ""
      return startTagAttributeName
  }
  currentLoc.attributes[currentAttribute] += c
  return startTagAttributeValue
}

function afterStartTag(c) {
  if(/[\s]/.exec(c)) {
      return afterStartTag
  }
  if(c === '<') {
      return openStartAfterStartTag
  }
  return currentTagInnerText(c)
}

function currentTagInnerText(c) {
  if(c === '<') {
      currentLoc.attributeComplete = true
      currentLocToParent()
      return openStartAfterEndTag
  }
  if(currentLoc.tag) {
      newChildCurrentLoc(true)
  }
  currentLoc.innerText += c
  return currentTagInnerText
}

function openStartAfterStartTag(c) {
  if(/[\s]/.exec(c)) {
      return openStartAfterStartTag
  }
  if(c === '/') {
      return endTagStart(c)
  }
  if(/[A-Za-z]/.exec(c)) {
      newChildCurrentLoc()
      return startTag(c)
  }
}


function endTagStart(c) {
  if(c === '/') {
      return endTagStart
  }
  if(/[A-Za-z]/.exec(c)) {
      return endTagName(c)
  }
}
function endTagName(c) {
  if(/[A-Za-z]/.exec(c)) {
      currentEndTag += c
      return endTagName
  }
  if(/[\s]/.exec(c)) {
      if(currentEndTag !== currentLoc.tag) {
        if(currentLoc.tag === "input") {
          // input can be closed without self-closing mark
          currentLocToParent()
          return endTagName(c)
        }
        throw new Error(`${currentLoc.tag} not matching with ${currentEndTag}`)
      }
      currentEndTag = ''
      return endTagName
  }
  if(c === '>') {
      if(currentEndTag !== currentLoc.tag) {
        if(currentLoc.tag === "input") {
          // input can be closed without self-closing mark
          currentLocToParent()
          return endTagName(c)
        }
          throw new Error(`${currentLoc.tag} not matching with ${currentEndTag}`)
      }
      currentEndTag = ''
      return endTagEnd(c)
  }
}
function endTagEnd(c) {
  if(/[\s]/.exec(c)) {
      return endTagEnd
  }
  if(c === '>') {
      currentLocToParent()
      return afterEndTag
  }
}
function afterEndTag(c) {
  if(/[\s]/.exec(c)) {
      return afterEndTag
  }
  if(c === '<') {
      return openStartAfterEndTag
  }
  // newChildCurrentLoc(true)
  // return textNodeNew(c)
  return currentTagInnerText(c)
}


function openStartAfterEndTag(c) {
  if(c === '/') {
      return endTagStart(c)
  }
  if(/[A-Za-z]/.exec(c)) {
      newChildCurrentLoc()
      return startTag(c)
  }
  if(/[\s]/.exec(c)) {
    return openStartAfterEndTag
  }
}

function commitRoot({type, innerText, tag, attributes}) {
  if(type === "text") {
    const text = document.createTextNode(innerText)
    return text
  }
  const mainEle = document.createElement(tag)
  for(const attr in attributes) {
      mainEle.setAttribute(attr, attributes[attr])
  }
  return mainEle
}

function render(template) {
    let status = start

    return function rootsGen(ddl) {
      for(; templateIterIndex < template.length; templateIterIndex++) {
        if(ddl.timeRemaining() < 10) {
          break
        } 
        status = status(template[templateIterIndex])
      }

      if(templateIterIndex === template.length) {
        status = null
      }

      let cnt = 1000

      while(!ddl.didTimeout && cnt--) {
        if(currentRoot.dom) {
          if(currentRoot.child && !(currentRoot.child.dom)) {
            currentRoot = currentRoot.child
          } else if(currentRoot.lastChild && !(currentRoot.lastChild.dom)) {
            currentRoot = currentRoot.lastChild
          } else if(currentRoot.sibling && !(currentRoot.sibling.dom)) {
            currentRoot = currentRoot.sibling
          } else if(currentRoot !== tree){
            currentRoot = currentRoot.parentNode
          }
        } else if(currentRoot.attributeComplete) {
          currentRoot.dom = commitRoot(currentRoot)
          if(currentRoot.parentNode.lastChild === currentRoot || !currentRoot.preSibling || currentRoot.preSibling?.dom) {
            currentRoot.parentNode.dom.appendChild(currentRoot.dom)
          } else if(currentRoot.preSibling && !currentRoot.preSibling.dom) {
            currentRoot = currentRoot.preSibling
          }
        }
      }

      if(status) {
        requestIdleCallback(rootsGen)
      } else if(currentRoot !== tree) {
        requestIdleCallback(rootsGen)
      }
    }
}
 
requestIdleCallback(render(pttChannel.repeat(500)))
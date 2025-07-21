console.log("background is running");

let copyData = {
    infoData: "",
    linkedInList: null
};
chrome.runtime.onMessage.addListener(messageResponse);
chrome.action.onClicked.addListener(buttonClicked);

function buttonClicked(tab) {
    let msg = {
        url: tab.url, 
        data: copyData
    }
    if (tab.url.includes("linkedin.com") || tab.url.includes("revenuevessel.com")) {
        console.log("Forge was clicked");
        chrome.tabs.sendMessage(tab.id, msg);
    } else {
        copyData.infoData = "";
        copyData.infoData = null;
        console.log("data .reset")
    }
}

function messageResponse(message, sender, sendResponse) {
    if (message.request === "TabInfo") {
        sendResponse(sender.tab.url);
    } else if (message.request === "StoreLinkedInData"){
        console.log(message.data.join('\n') + "was stored")
        copyData.linkedInList = message.data;
    }else if (message.request == "StoreRevVesselData") {
        if (copyData.linkedInList) {
            copyData.linkedInList = copyData.linkedInList.filter(person => {
                return !(person.includes(message.name));
            })
            console.log("something was filtering")
        }
        console.log(message.data);
        copyData.infoData = message.data + '\n' + copyData.infoData;
    }
}
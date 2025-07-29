const priorityKeywords = [
  'vp sales', 'vice president', 'chief', 'supply', 'logistic', 'buyer',
  'controller', 'sourcing', 'customs', 'founder', 'owner',
  'procurement', 'import', 'export', 'chairman', 'supplier',
  'purchasing', 'president', 'operation', 'manufacturing'
];

const priorityRegexKeywords = [
  /\bceo\b/, /\bcfo\b/, /\bcro\b/, /\bcoo\b/
];

const junkKeywords = [
  'account', 'account manager', 'accountant', 'accounting', 'administrative',
  'animator', 'architect', 'assistant', 'brand', 'brewer', 'communications',
  'content', 'coordinator', 'creative', 'crm', 'customer experience', 'cx',
  'designer', 'editorial', 'education', 'envi', 'engagement', 'engineer',
  'events', 'front desk', 'influencer', 'legal', 'loyalty', 'marketing',
  'merchandising', 'paid media', 'people experience', 'photographer', 'planner',
  'planning', 'product', 'project manager', 'public relations', 'quality',
  'scientist', 'recruiting', 'relation', 'research', 'retouch',
  'sales', 'social', 'chemist', 'store', 'student', 'stylist',
  'talent acquisition', 'tax', 'training', 'technologist', 'independent',
  'writer', 'waiter', 'advisor', 'teacher', 'human resource',
  'customer service', 'bachelor', 'chemical', 'affairs', 'warehouse supervisor', 
  'forklift', 'warehouse', 'machine operator', 'maintenance', 'security', 'emea',
  'apac'
];

const junkRegexKeywords = [
  /\bart\b/, /\bhr\b/, /\bartist\b/, /\bintern\b/, /\bit\b/, /\bn\/a\b/,
  /\bpr\b/, /\bteaching\b/, /\bsoftware\b/, /\bmanager\b/, /\bdeveloper\b/
];


// Run in background for RevenueVessel 
chrome.runtime.sendMessage({request: "TabInfo"}, storeData);

let tabUrl;

let button;

function storeData(response) {
  button = document.querySelector('.rounded-md.px-3.py-2');
  tabUrl = response;
  // Scrape immediately if no button (as you already do)
  if (tabUrl.includes("revenuevessel.com/dashboard/contacts") && !button) {
    scrapeRevVessel();
  }

  // If button exists, add click handler
  if (button && tabUrl.includes("revenuevessel.com/dashboard/contacts")) {
    button.addEventListener('click', () => {
      // Wait for DOM to update after button click
      setTimeout(scrapeRevVessel, 1000); // Adjust timeout if necessary
    });
  }
}


function scrapeRevVessel() {
  let data = [...document.querySelectorAll('.text-ellipsis')]
    .map(el => {
      let text = el.innerText.trim().replace(/^\+/, '');
      if (text === "Not Found"|| text ==="Not Yet Available" || text === "Fetching. Please return in a few minutes" ||
        text === "Not Requested" || text === "" || text == "Email Not Found By Provider") {
          text = '    '
      }
      return text;
  });

  const fullName = document.querySelector('span.text-base.font-semibold.leading-6.text-gray-900.cursor-default')?.innerText.trim()

  data.unshift(fullName); 
  let filterData = data.filter((el, i) => {
      if(i === 6 ) return false
      if(i % 2 === 0 && i <= 12) return true;});

  let merged = filterData.at(-2) + ", " +filterData.at(-1);

  filterData = [...filterData.slice(0,-2), merged];

  filterData.splice(-1, 0, " ", " ");
  filterData.splice(2, 0, " ", " ", " ");


  const output = filterData.join('\t'); 

  try {
    chrome.runtime.sendMessage({request: "StoreRevVesselData", data: output, name: fullName});
  } catch (err) {
    console.warn("Message failed:", err);
  }
}


// If Chrome Extension Clicked
chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(message){
  if (message.url.includes("linkedin.com")) {
    console.log("button pressed");
    scrapeLinkedIn();
  } else if (message.url.includes("revenuevessel.com")) {
    console.log("button works");
    if (Array.isArray(message.data.linkedInList)) {
      const totalList = message.data.infoData + message.data.linkedInList.join('\n');
      copyRevVesselData(totalList);
    } else {
      console.log("It is not an array")
      copyRevVesselData(message.data.infoData);

    }
  }
}

function copyRevVesselData(data) {
  console.log("Data on clipboard")
  navigator.clipboard.writeText(data);
}

function scrapeLinkedIn() {
    const output = [...document.querySelectorAll('.artdeco-entity-lockup__content')]
    .map(el => {
        const nameEl =
        el.querySelector('.artdeco-entity-lockup__title a div') ||
        el.querySelector('.artdeco-entity-lockup__title > div');
        const name = nameEl?.innerText.trim() || 'N/A';

        const title =
        el.querySelector('.artdeco-entity-lockup__subtitle div div')?.innerText.trim() ||
        'N/A';

        const link =
        el.querySelector('.artdeco-entity-lockup__title a')?.href || 'Private Profile';

        return { name, title, link };
    })
    .filter(person => {
        const lcTitle = person.title.toLowerCase().replace(/\s+/g, ' ').trim();

        if (person.link === 'Private Profile' && person.title.length < 30) return false;

        if (
        priorityKeywords.some(kw => lcTitle.includes(kw)) ||
        priorityRegexKeywords.some(rx => rx.test(lcTitle))
        ) {
        return true;
        }

        return !(
        junkKeywords.some(kw => lcTitle.includes(kw)) ||
        junkRegexKeywords.some(rx => rx.test(lcTitle))
        );
    })
    .sort((a, b) => {
        const aMatch = priorityKeywords.some(kw => a.title.toLowerCase().includes(kw)) || priorityRegexKeywords.some(rx => rx.test(a.title.toLowerCase()));
        const bMatch = priorityKeywords.some(kw => b.title.toLowerCase().includes(kw))|| priorityRegexKeywords.some(rx => rx.test(b.title.toLowerCase()));
        return bMatch - aMatch;
    })
    .map(({ name, title, link }) => `${name}\t${title}\t${link}`)
    // .join('\n');
    
    chrome.runtime.sendMessage({request: "StoreLinkedInData", data: output});
    console.log("sent message");
}
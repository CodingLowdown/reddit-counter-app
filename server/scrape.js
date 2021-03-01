require('dotenv').config()

const axios = require('axios')
const Reddit = require('reddit')
const fs = require('fs')

const ValidTickers= JSON.parse(fs.readFileSync('./validTickers.json'))
const stockList = ValidTickers.map(({ Symbol }) => Symbol);
const stockListName = ValidTickers.map(({ Name }) => Name);
const moment = require('moment')
const lodash = require('lodash')

async function getRedditPost(date) {
  const reddit = new Reddit({
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASSWORD,
    appId: process.env.REDDIT_APP_ID,
    appSecret: process.env.REDDIT_APP_SECRET,
    userAgent: 'MyApp/1.0.0 (http://example.com)'
  })
  let dateFormat = moment(date).format('MMMM DD, YYYY')
  let dailyThread=`Daily Discussion Thread for ${dateFormat}`
  let url = `https://www.reddit.com/r/wallstreetbets/search.json?q=title%3A${encodeURIComponent(dailyThread)}&sort=new&restrict_sr=on`
  // console.log(url)
  let res3 = await axios.get(url)
  let resultName = lodash.get(res3.data.data,'children[0].data.name','Missing')
  let resultTitle = lodash.get(res3.data.data,'children[0].data.title','Missing')
  if (resultTitle.toLowerCase().includes('unpinned')) {
      resultName = lodash.get(res3.data.data,'children[1].data.name','Missing')
      resultTitle = lodash.get(res3.data.data,'children[1].data.title','Missing')
  }
  // console.log(resultName)
  return {name: resultName, title: resultTitle}
}

async function master2(daycount) {
  let dateRun = moment().subtract(daycount,'days')
  // console.log(dateRun)
  let dateRunFormat = dateRun.format('YYYY_MM_DD')
  console.log(dateRunFormat)
  let namePost =  await getRedditPost(dateRun)
  // console.log(namePost)
  if (namePost.name==='Missing') {

  } else {
    await master(namePost.name,namePost.title,dateRunFormat)
  }
  
}



async function master(name,title,dFormat) {
  let stockCount = {}
  stockCount[dFormat] = {}
  
  for (let stonk=0; stonk<stockList.length; stonk+=1) {
    stockCount[dFormat][stockList[stonk]] =0
  }
    const reddit = new Reddit({
        username: process.env.REDDIT_USER,
        password: process.env.REDDIT_PASSWORD,
        appId: process.env.REDDIT_APP_ID,
        appSecret: process.env.REDDIT_APP_SECRET,
        userAgent: 'MyApp/1.0.0 (http://example.com)'
      })
    //   let res = await reddit.get('/api/subreddit_autocomplete', {query: "wallstreetbets", include_profiles: false})
    //   console.log(res)

    // let res = await axios.get('https://www.reddit.com/r/wallstreetbets/hot.json')
    
    // // console.log(res.data.data.children[0].data)
    // console.log(res.data.data.children[0].data.name)
    // console.log(res.data.data.children[0].data)
    // let discussionName = res.data.data.children[0].data.name
    // let discussionTitle = res.data.data.children[0].data.title
    // let discussionNameSplit = res.data.data.children[0].data.name.split('_')[1]

    let discussionName = name
    let discussionTitle = title
    let discussionNameSplit = discussionName.split('_')[1]
   
    let res2 = await axios.get(`https://www.reddit.com/comments/${discussionNameSplit}.json`)
    let children = res2.data[1].data.children
    let newLinks = res2.data[1].data.children[children.length-1].data.children
    
    let postList = []
    for (let i=0; i< children.length-1; i+=1) {
      let posts = children[i].data.body
      postList.push(posts)
    }



    for (let i=0; i< newLinks.length; i+=50) {
      let dataRequestArraychildren = []
      for (let j=0; j<50; j+=1 ) {
        let num = i+j
        // console.log(newLinks[num])
        if (newLinks[num]==undefined) {
          continue
        }
        dataRequestArraychildren.push(newLinks[num])
      }
      let stringChildrenJoin = dataRequestArraychildren.join(',')
      // console.log(stringChildrenJoin)
      let res3 = await reddit.get('/api/morechildren', {link_id: discussionName, children: stringChildrenJoin, api_type:"json"})
      let child = res3.json.data.things
      for (let k=0; k< child.length-1; k+=1) {
        let posts = child[k].data.body
        postList.push(posts)
      }
      // await sleep(1000)
      console.log(i)
      console.log(postList.length)
      fs.writeFileSync('./testData.json', JSON.stringify(postList))
    }
    
    for (let i=0; i<postList.length; i+=1 ) {
      for (let stonk=0; stonk<stockList.length; stonk+=1) {
        if (postList[i]==undefined) {
          continue
        }
        if(postList[i].includes(' '+ stockList[stonk]+' ') || postList[i].includes('$'+ stockList[stonk]+' ') || postList[i].includes('$'+ stockList[stonk]+',') || postList[i].includes(stockListName[stonk])) {
          stockCount[dFormat][stockList[stonk]] +=1 
        }
      }
    }
    let dataReturn = await sortObject(stockCount)
  // fs.writeFileSync('./SavedStocksCount.json', JSON.stringify(dataReturn))
    // let res3 = await reddit.get('/api/morechildren', {link_id: "t3_lnd8jo", children:'go0kjk1', api_type:"json"})
    // console.log(res3.json.data.things)

    return dataReturn
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}  


async function readData() {
  let dateRun = moment().subtract(10,'days')
  console.log(dateRun)
  let dateRunFormat = dateRun.format('YYYY_MM_DD')
  let stockCount = {}
  stockCount[dateRunFormat] = {}
  
  for (let stonk=0; stonk<stockList.length; stonk+=1) {
    stockCount[dateRunFormat][stockList[stonk]] =0
  }
  let dataRead =JSON.parse(fs.readFileSync('./testData.json'))
  for (let i=0; i<dataRead.length; i+=1 ) {
    console.log(i)
    for (let stonk=0; stonk<stockList.length; stonk+=1) {
      if (dataRead[i]==undefined) {
        continue
      }
      if(dataRead[i].includes(' '+ stockList[stonk]+' ') || dataRead[i].includes('$'+ stockList[stonk]+' ') || dataRead[i].includes('$'+ stockList[stonk]+',') || dataRead[i].includes(stockListName[stonk])) {
        stockCount[dateRunFormat][stockList[stonk]] +=1 
      }
    }
  }
  fs.writeFileSync('./SavedStocksCount.json', JSON.stringify(stockCount))
}


async function sortObject(dataRead) {
  let newObject = {}
  let dataResult = JSON.parse(fs.readFileSync('./return_List.json'))
  // let dataRead = JSON.parse(fs.readFileSync('./SavedStocksCount.json'))
  let dateArray = Object.keys(dataRead)
  for (let i=0; i<dateArray.length; i+=1 ) {
    let values = Object.values(dataRead[dateArray[i]])
    let keys = Object.keys(dataRead[dateArray[i]])
    newObject[dateArray[i]] = {}
    values.map((ele,ind) => {
      if (values[ind]>0) {
        newObject[dateArray[i]][keys[ind]] = values[ind]
      }
    })
    const sortable = Object.fromEntries(
      Object.entries(newObject[dateArray[i]]).sort(([,a],[,b]) => b-a)
    );
    dataResult[dateArray[i]] = {}
    dataResult[dateArray[i]] = sortable
    console.log(dataResult[dateArray[i]])
  }
  
  fs.writeFileSync('./return_List.json', JSON.stringify(dataResult))
  return dataResult
}


async function runLast2Weeks() {
  for (let i=0; i<16; i+=1) {
    await master2(i)
  }
  
}

// runLast2Weeks()

// master2(9)
master2(6)
master2(2)

// sortObject()

// readData()



// master2()

// module.exports = {
//     master
// }
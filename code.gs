function storeSecret(){
  PropertiesService.getScriptProperties().setProperties({
    NOTION_API_KEY:"secret_xxxx"
  });
}

function getNotionData(){
  const apiKey = PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");
  const header = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": "2022-06-28",

  };

  const data = {
    filter:{
      or:[
        {
          property:"Name",
          title:{
            is_not_empty: true,
          },
        },
      ],
    },
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    headers: header,
    payload: JSON.stringify(data),
  };

  const reponse = UrlFetchApp.fetch(
    "https://api.notion.com/v1/databases/ba04447ee8124668bd83e5430fab279d/query",
    options
  );

  return reponse.getContentText();
}

function getNotionCommentData(block_id) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");
  const header = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": "2022-06-28",
  };

  const options = {
    method: "GET",
    contentType: "application/json",
    headers: header,
  };

  const response = UrlFetchApp.fetch(
    `https://api.notion.com/v1/comments?block_id=${block_id}`,
    options
  );

  const responseData = response.getContentText();
  // console.log("Notion Comment Data:", responseData);  // Print the raw response data

  return responseData;
}

function addCommentToNotion(pageId, comment) {
  console.log(pageId,comment);
  const apiKey = PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");
  const header = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": "2022-06-28",
  };

  const data = {
    parent: {
      type: "page_id",
      page_id: pageId[0],
    },
    rich_text: [
      {
        type: "text",
        text: {
          content: comment,
        },
      },
    ],
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    headers: header,
    payload: JSON.stringify(data),
  };

  const response = UrlFetchApp.fetch("https://api.notion.com/v1/comments", options);
  const responseData = response.getContentText();
  console.log("Comment added to Notion:", responseData);
  return responseData;
}

function incrementLikes(pageId,titlefromapp) {
  storeSecret();
  const apiKey = PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");
  const header = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": "2022-06-28",
  };

  // Fetch the current page data
  const fetchOptions = {
    method: "GET",
    contentType: "application/json",
    headers: header,
  };
  console.log(`https://api.notion.com/v1/pages/${pageId}`);
  const fetchResponse = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${pageId}`, fetchOptions);
  const pageData = JSON.parse(fetchResponse.getContentText());

  // Get the current likes count
  currentLikes = parseInt(pageData.properties.Likes.rich_text[0].text.content, 10);
  const title = pageData.properties.Name.title[0].text.content;
  

  if(titlefromapp==title){
    // Increment the likes count
    currentLikes = currentLikes + 1;

    // Update the page with the new likes count
    const updateData = {
      properties: {
        Likes: {
          rich_text: [
            {
              type: "text",
              text: {
                content: currentLikes.toString(),
              },
            },
          ],
        },
      },
    };

    const updateOptions = {
      method: "PATCH",
      contentType: "application/json",
      headers: header,
      payload: JSON.stringify(updateData),
    };
  
    const updateResponse = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${pageId}`, updateOptions);
    const updateResponseData = updateResponse.getContentText();
  }
  
  const res= title +"'s Likes updated: "+ currentLikes + "\n";
  console.log(res);
  return res
}

function createAllEvent(){
  storeSecret();
  const notionData = JSON.parse(getNotionData());
  
  const calendarID = "primary";

  notionData.results.forEach((notionEvent) => {
    const eventProperties = notionEvent.properties;
    const eventFromNotion = {
      summary: eventProperties.Name.title[0].text.content,
      start: {
        dateTime: new Date(eventProperties.Date.date.start).toISOString(),
      },
      end: {
        dateTime: new Date(eventProperties.Date.date.end).toISOString(),
      },
      location: eventProperties.Location.rich_text[0].text.content,
      description: eventProperties.Tags.multi_select.map(tag => tag.name).join(', '),
      comment: '',
      like:eventProperties.Likes.rich_text[0].text.content,
    };

    // Extract block ID from the comment link

    if (eventProperties.comment && eventProperties.comment.rich_text && eventProperties.comment.rich_text.length > 0) {
      const commentLink = eventProperties.comment.rich_text[0].text.content;
      const blockIdMatch = commentLink.match(/([0-9a-f]{32})/);
      if (blockIdMatch) {
        const blockId = blockIdMatch[0];
        const commentData = JSON.parse(getNotionCommentData(blockId));

        // Parse comment data
        const comments = commentData.results.map(comment => {
          return comment.rich_text.map(text => text.plain_text).join(' ');
        }).join(',');

        // Add comments to the event description
        eventFromNotion.comment = comments;
      }
    }


    // Print event details before creating
    console.log("Event Details:", JSON.stringify(eventFromNotion, null, 2));

    try {
      const event = Calendar.Events.insert(eventFromNotion, calendarID);
      console.log("Event created: " + event.summary);
    } catch (err) {
      console.log("Failed to create: " + err.message);
    }
  });
}

// send to calendar
function sendToCalendar(title, checkFav){
  console.log(title,checkFav);
  // if(checkFav != ""){
  //   console.log("ady saved...");
  //   return;
  // }
    
  storeSecret();
  const notionData = JSON.parse(getNotionData());
  const calendarID = "primary";
  
  notionData.results.forEach((notionEvent) => {
    const eventProperties = notionEvent.properties;
    const eventFromNotion = {
      summary: eventProperties.Name.title[0].text.content,
      start: {
        dateTime: new Date(eventProperties.Date.date.start).toISOString(),
      },
      end: {
        dateTime: new Date(eventProperties.Date.date.end).toISOString(),
      },
      attendees: [
      {email: 'chyeyantong03@gmail.com'},
      {email: 'hongymb07@gmail.com'},
      {email: 'jsukli20030412@gmail.com'},
      {email: 'joanyee2003@gmail.com'}
      ],
      location: eventProperties.Location.rich_text[0].text.content,
      description: eventProperties.Tags.multi_select.map(tag => tag.name).join(', '),
      comment: '',
      like:eventProperties.Likes.rich_text[0].text.content,

    };

    // Extract block ID from the comment link

    if (eventProperties.comment && eventProperties.comment.rich_text && eventProperties.comment.rich_text.length > 0) {
      const commentLink = eventProperties.comment.rich_text[0].text.content;
      const blockIdMatch = commentLink.match(/([0-9a-f]{32})/);
      if (blockIdMatch) {
        const blockId = blockIdMatch[0];
        const commentData = JSON.parse(getNotionCommentData(blockId));

        // Parse comment data
        const comments = commentData.results.map(comment => {
          return comment.rich_text.map(text => text.plain_text).join(' ');
        }).join(',');

        // Add comments to the event description
        eventFromNotion.comment = comments;
      }
    }
    console.log("this is  " + eventFromNotion.summary+ " "+ title);


    if(eventFromNotion.summary == title){
      // Print event details before creating
      console.log("Event Details:", JSON.stringify(eventFromNotion, null, 2));

      try {
        const event = Calendar.Events.insert(eventFromNotion, calendarID);
        console.log("Event created: " + event.summary);
      } catch (err) {
        console.log("Failed to create: " + err.message);
      }
      return;
      }
  });
}

function LikeAndSendMail(block_id_list,title){
  content = "Congrats, You have like this >>> " + title + "\n";
  content += "=================================================\n";
  content += "Liked List:\n"; 
  block_id_list.forEach((block_id)=>{
    content += incrementLikes(block_id,title);
  });
  if(content!=""){
    MailApp.sendEmail("chyeyantong03@gmail.com","Watch out! ur bazaar's like have updated",content);
    MailApp.sendEmail("hongymb07@gmail.com","Watch out! ur bazaar's like have updated",content);
    MailApp.sendEmail("jsukli20030412@gmail.com","Watch out! ur bazaar's like have updated",content);
    MailApp.sendEmail("joanyee2003@gmail.com","Watch out! ur bazaar's like have updated",content);
    console.log("ADY send Mail to 4 members...");
  }
  else{
    console.log("like havent hit 10");
  }
  
  // incrementLikes("5ff5d84c013049c0ab7e049060438aac");
}

// add event 
function addEventToNotionCalendar(name, startDate, endDate, location, tags) {
  tagsList = tags.split(',');
  const apiKey = PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");
  const databaseId = "ba04447ee8124668bd83e5430fab279d"; // Replace with your database ID
  const header = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": "2022-06-28",
  };

  const data = {
    parent: {
      database_id: databaseId,
    },
    properties: {
      Name: {
        title: [
          {
            type: "text",
            text: {
              content: name,
            },
          },
        ],
      },
      Date: {
        date: {
          start: new Date(startDate).toISOString(),
          end: new Date(endDate).toISOString(),
        },
      },
      Location: {
        rich_text: [
          {
            type: "text",
            text: {
              content: location,
            },
          },
        ],
      },
      Tags: {
        multi_select: tagsList.map(tag => ({ name: tag })),
      },
      Likes: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "0",
            },
          },
        ],
      },
      comment: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "",
            },
          },
        ],
      },
    },
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    headers: header,
    payload: JSON.stringify(data),
  };

  const response = UrlFetchApp.fetch("https://api.notion.com/v1/pages", options);
  const responseData = JSON.parse(response.getContentText());
  id = responseData.id.replace(/-/g, '');
  console.log("Event added:", id);  
  return id;
}

//////////////////////// testing locally

function testAddEvent(){
  const name = "Lonely god";
  const startDate = "2024-07-24T10:00:00Z";
  const endDate = "2024-07-24T11:00:00Z";
  const location = "Johor";
  const tags = "Young, Find NPY";

  console.log(addEventToNotionCalendar(name, startDate, endDate, location, tags));
}

function testWriteComment() {
  addCommentToNotion("5ff5d84c013049c0ab7e049060438aac","this is nice");
}

// function testLike(block_id_str){
//   console.log(">>",block_id_str);
//   LikeAndSendMail("chyeyantong03@gmail.com",block_id_str);
//   LikeAndSendMail("hongymb07@gmail.com",block_id_str);
//   LikeAndSendMail("jsukli20030412@gmail.com",block_id_str);
//   LikeAndSendMail("joanyee2003@gmail.com",block_id_str);
// }

function testSendCalendar(){
  sendToCalendar("Halo Pink","");
}

function testAddToAppSheet(block_id_str,title){
  LikeAndSendMail(block_id_str);
  sendToCalendar(title);
}



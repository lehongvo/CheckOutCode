const moment = require('moment');

// Base time for "2024-08-01T04:31:10.429629" and will increment day by day
const baseTime = moment("2024-08-01T04:31:10.429629");

// Generate 200 sample entries for userId from 1 to 20 and isNewUser = false
const totalEntries = 50;
const entriesPerUser = totalEntries / 20;
const userDataWithUpdatedTime = [];

for (let i = 1; i <= 20; i++) {  // Looping through userIds 1 to 20
    for (let j = 0; j < entriesPerUser; j++) {  // Generating multiple entries per user
        // Increment the date for each entry
        const currentTime = baseTime.clone().add(j % 19, 'days');  // Loop through days 1 to 19 in August
        const data = {
            timeLogin: currentTime.toISOString(),
            isNewUser: false,
            userId: i
        };
        userDataWithUpdatedTime.push(data);
    }
}

// Convert to JSON format
const jsonUserDataWithUpdatedTime = JSON.stringify(userDataWithUpdatedTime, null, 4);
console.log(jsonUserDataWithUpdatedTime);

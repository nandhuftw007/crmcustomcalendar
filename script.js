let currentDate = new Date();
let today = new Date();

// Function to get the week's dates based on a given date
function getWeekDates(date) {
    const firstDayOfWeek = date.getDate() - date.getDay(); // Sunday as the first day of the week
    let weekDates = [];
    for (let i = 0; i < 7; i++) {
        let day = new Date(date);
        day.setDate(firstDayOfWeek + i);
        weekDates.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
    return weekDates;
}

// Populate the calendar header with the week's dates
function populateCalendarHeader() {
    const weekDates = getWeekDates(new Date(currentDate));
    const calendarHeader = document.getElementById('calendarHeader');
    // Clear any existing headers
    while (calendarHeader.firstChild) {
        calendarHeader.removeChild(calendarHeader.firstChild);
    }
    // Add corner cell
    const cornerCell = document.createElement('th');
    cornerCell.className = 'corner';
    calendarHeader.appendChild(cornerCell);
    // Add date headers
    weekDates.forEach(date => {
        const dateHeader = document.createElement('th');
        dateHeader.className = 'colHeader';
        dateHeader.innerText = date;
        calendarHeader.appendChild(dateHeader);
    });
}

function formatTimeTo12Hour(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getDayOfWeek(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

function createThreeDotsButton() {
    let threeDotsButton = document.createElement('button');
    threeDotsButton.className = 'three-dots-button';
    threeDotsButton.innerText = '...';
    return threeDotsButton;
}

function createUnavailabilityOptions(tempId, cellDate) {
    let options = document.createElement('div');
    options.className = 'unavailability-options';
    options.style.display = 'none';

    let allDayButton = document.createElement('button');
    allDayButton.innerText = 'Mark Unavailable (All Day)';
    allDayButton.dataset.tempId = tempId;
    allDayButton.dataset.cellDate = cellDate;
    allDayButton.addEventListener('click', function() {
        insertTimeOffRecord(this.dataset.tempId, this.dataset.cellDate);
        options.style.display = 'none';
    });
    options.appendChild(allDayButton);

    let hourlyButton = document.createElement('button');
    hourlyButton.innerText = 'Mark Unavailable (Hourly)';
    hourlyButton.dataset.tempId = tempId;
    hourlyButton.dataset.cellDate = cellDate;
    hourlyButton.addEventListener('click', function() {
        markUnavailableHourly(this.dataset.tempId, this.dataset.cellDate);
        options.style.display = 'none';
    });
    options.appendChild(hourlyButton);

    let addScheduleButton = document.createElement('button');
    addScheduleButton.innerText = 'Add Schedule';
    addScheduleButton.dataset.tempId = tempId;
    addScheduleButton.dataset.cellDate = cellDate;
    addScheduleButton.addEventListener('click', function() {
        // Implement your add schedule logic here
        alert(`Add schedule for Temp ID: ${this.dataset.tempId} on ${this.dataset.cellDate}`);
        options.style.display = 'none';
    });
    options.appendChild(addScheduleButton);

    return options;
}

function handleThreeDotsButtonClick(event) {
    let options = event.target.parentElement.querySelector('.unavailability-options');
    if (options.style.display === 'none' || options.style.display === '') {
        options.style.display = 'block';
    } else {
        options.style.display = 'none';
    }
}

function populateCalendarBody(leads, schedules, timeOffRecords) {
    let tbody = document.querySelector('#calendarTable tbody');
    tbody.innerHTML = ""; // Clear any existing rows

    const weekDates = getWeekDates(new Date(currentDate));
    const weekStartDate = new Date(weekDates[0]);
    const weekEndDate = new Date(weekDates[weekDates.length - 1]);
    weekEndDate.setHours(23, 59, 59, 999); // Set the end date to the last millisecond of the day

    leads.forEach(lead => {
        let row = document.createElement('tr');
        let rowHeader = document.createElement('td');
        rowHeader.className = 'rowHeader';
        rowHeader.innerText = `${lead.First_Name} ${lead.Last_Name} (${lead.id})`;
        row.appendChild(rowHeader);
    
        weekDates.forEach(dateString => {
          let cell = document.createElement('td');
          cell.className = 'cell';
          cell.dataset.time = `${dateString}, ${lead.First_Name} ${lead.Last_Name}`;
          cell.dataset.tempId = lead.id;
            let cellDate = new Date(dateString);
            cellDate.setHours(0, 0, 0, 0);
            let dayOfWeek = getDayOfWeek(cellDate.getDay());

            // Check for unavailability records
            let unavailabilityRecord = timeOffRecords.find(record => {
                if (record.Unavailability === 'All Day' && record.Unavailable_day === moment(cellDate).format('YYYY-MM-DD') && record.Name1.id === lead.id) {
                    return true;
                } else if (record.Unavailability === 'Hourly' && moment(record.From_Date_Time).format('YYYY-MM-DD') === moment(cellDate).format('YYYY-MM-DD') && record.Name1.id === lead.id) {
                    return true;
                }
                return false;
            });

            if (unavailabilityRecord) {
                if (unavailabilityRecord.Unavailability === 'All Day') {
                    cell.innerHTML = "Unavailable All Day";
                    cell.classList.add('unavailable');
                } else if (unavailabilityRecord.Unavailability === 'Hourly') {
                    let startTimeString = moment(unavailabilityRecord.From_Date_Time).format('hh:mm a');
                    let endTimeString = moment(unavailabilityRecord.To_Date).format('hh:mm a');
                    
                    // Calculate the position of the hourly unavailability within the cell
                    let startHour = moment(unavailabilityRecord.From_Date_Time).hour();
                    let startMinute = moment(unavailabilityRecord.From_Date_Time).minute();
                    let endHour = moment(unavailabilityRecord.To_Date).hour();
                    let endMinute = moment(unavailabilityRecord.To_Date).minute();

                    // Create a div for hourly unavailability and set its position
                    let hourlyUnavailabilityDiv = document.createElement('div');
                    hourlyUnavailabilityDiv.className = 'hourly-unavailable';
                    hourlyUnavailabilityDiv.innerHTML = `Unavailable (${startTimeString} - ${endTimeString})`;

                    // Calculate top position based on start time
                    let startPosition = ((startHour * 60 + startMinute) / (24 * 60)) * 100;
                    let endPosition = ((endHour * 60 + endMinute) / (24 * 60)) * 100;
                    let duration = endPosition - startPosition;

                    hourlyUnavailabilityDiv.style.position = 'absolute';
                    hourlyUnavailabilityDiv.style.top = `${startPosition}%`;
                    hourlyUnavailabilityDiv.style.height = `${duration}%`;

                    cell.appendChild(hourlyUnavailabilityDiv);
                    cell.classList.add('unavailable');
                }
            } else {
                // Render schedules
                let scheduleHtml = '';
                schedules.forEach(schedule => {
                    if (schedule.Schedule_For_Temp && schedule.Schedule_For_Temp.id === lead.id) {
                        let jobName = schedule.Job ? schedule.Job.name : "No Job Assigned";
                        let daysInWeek = schedule.Days_in_the_Week;
                        let startDateTime = new Date(schedule.Start_Date_and_Work_Start_Time);
                        let endDateTime = new Date(schedule.End_Date_and_Work_End_Time);
                        let prevDayDateTime = new Date(startDateTime);
                        prevDayDateTime.setDate(prevDayDateTime.getDate() - 0); // Adjust to check previous day

                        let selectedDays = [];
                        if (daysInWeek.includes('Daily')) {
                            selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        } else if (daysInWeek.includes('Weekdays')) {
                            selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        } else {
                            selectedDays = daysInWeek;
                        }

                        if (selectedDays.includes(dayOfWeek)) {
                            if (startDateTime <= cellDate && endDateTime >= cellDate) {
                                let startTimeString = formatTimeTo12Hour(startDateTime);
                                let endTimeString = formatTimeTo12Hour(endDateTime);
                                if (cellDate.toDateString() === startDateTime.toDateString()) {
                                    scheduleHtml += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                                } else if (cellDate > startDateTime && cellDate < endDateTime) {
                                    scheduleHtml += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                                }
                            }

                            if (cellDate.toDateString() === prevDayDateTime.toDateString()) {
                                let startTimeString = formatTimeTo12Hour(startDateTime);
                                let endTimeString = formatTimeTo12Hour(endDateTime);
                                scheduleHtml += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                            }
                        }
                    }
                });

                cell.innerHTML = scheduleHtml;

                if (scheduleHtml === '') {
                    // Add plus button if no schedule
                    let plusButton = document.createElement('button');
                    plusButton.className = 'plus-button';
                    plusButton.innerText = '+';
                    plusButton.addEventListener('click', function() {
                      // Call the API to fetch Accounts
                      ZOHO.CRM.API.getAllRecords({
                        Entity: "Accounts",
                        sort_order: "asc",
                        per_page: 200
                      })
                      .then(function(response) {
                        if (response.data && response.data.length > 0) {
                          const accounts = response.data.map(account => ({
                            id: account.id,
                            Account_Name: account.Account_Name
                          }));
                  
                          // Create a popup to display the account names
                          let popup = document.createElement("div");
                          popup.className = "popup";
                          popup.style.position = "absolute";
                          popup.style.top = "50%";
                          popup.style.left = "50%";
                          popup.style.transform = "translate(-50%, -50%)";
                          popup.style.background = "white";
                          popup.style.padding = "20px";
                          popup.style.border = "1px solid #ccc";
                          popup.style.borderRadius = "5px";
                          popup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
                          popup.style.maxHeight = "300px";
                          popup.style.overflowY = "auto";
                  
                          let popupContent = "";
                          accounts.forEach(function(account) {
                            popupContent += `
                              <p>
                                <input type="radio" name="account" value="${account.id}"> ${account.Account_Name}
                              </p>
                            `;
                          });
                  
                          popupContent += `
                            <button class="next-button">Next</button>
                            <button class="cancel-button">Cancel</button>
                          `;
                  
                          popup.innerHTML = popupContent;
                  
                          // Add the popup to the page
                          document.body.appendChild(popup);
                  
                          // Add a click event listener to the next button
                          let nextButton = popup.querySelector(".next-button");
                          nextButton.addEventListener("click", function() {
                            // Get the selected account ID
                            let selectedAccountId = popup.querySelector('input[name="account"]:checked').value;
                            console.log("Selected account ID:", selectedAccountId);
                  
                            // Call the API to fetch Deals for the selected account
                            ZOHO.CRM.API.getAllRecords({
                              Entity: "Deals",
                              Criteria: "Account_Name.id:equals:" + selectedAccountId,
                              sort_order: "asc",
                              per_page: 200
                            })
                            .then(function(response) {
                              if (response.data && response.data.length > 0) {
                                const deals = response.data.map(deal => ({
                                  id: deal.id,
                                  Deal_Name: deal.Deal_Name
                                }));
                  
                                // Create a new popup to display the deal names
                                let dealPopup = document.createElement("div");
                                dealPopup.className = "popup";
                                dealPopup.style.position = "absolute";
                                dealPopup.style.top = "50%";
                                dealPopup.style.left = "50%";
                                dealPopup.style.transform = "translate(-50%, -50%)";
                                dealPopup.style.background = "white";
                                dealPopup.style.padding = "20px";
                                dealPopup.style.border = "1px solid #ccc";
                                dealPopup.style.borderRadius = "5px";
                                dealPopup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
                                dealPopup.style.maxHeight = "300px";
                                dealPopup.style.overflowY = "auto";
                  
                                let dealPopupContent = "";
                                deals.forEach(function(deal) {
                                  dealPopupContent += `
                                    <p>
                                      <input type="radio" name="deal" value="${deal.id}"> ${deal.Deal_Name}
                                    </p>
                                  `;
                                });
                  
                                dealPopupContent += `
                                  <button class="select-button">Select</button>
                                  <button class="cancel-button">Cancel</button>
                                `;
                  
                                dealPopup.innerHTML = dealPopupContent;
                  
                                // Add the deal popup to the page
                                document.body.appendChild(dealPopup);
                  
                                // Add a click event listener to the select button
                                let selectButton = dealPopup.querySelector(".select-button");
                                selectButton.addEventListener("click", function() {
                                  // Get the selected deal ID
                                  let selectedDealId = dealPopup.querySelector('input[name="deal"]:checked').value;
                                  console.log("Selected deal ID:", selectedDealId);
                  
                                  // Create a new popup to input schedule details
                                  let schedulePopup = document.createElement("div");
                                  schedulePopup.className = "popup";
                                  schedulePopup.style.position = "absolute";
                                  schedulePopup.style.top = "50%";
                                  schedulePopup.style.left = "50%";
                                  schedulePopup.style.transform = "translate(-50%, -50%)";
                                  schedulePopup.style.background = "white";
                                  schedulePopup.style.padding = "20px";
                                  schedulePopup.style.border = "1px solid #ccc";
                                  schedulePopup.style.borderRadius = "5px";
                                  schedulePopup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
                                  schedulePopup.style.maxHeight = "300px";
                                  schedulePopup.style.overflowY = "auto";
                  
                                  let schedulePopupContent = `
                                    <p>Schedule Name: <input type="text" id="schedule-name"></p>
                                    <p>Start Date: <input type="date" id="start-date"></p>
                                    <p>Start Time: <input type="time" id="start-time"></p>
                                    <p>End Date: <input type="date" id="end-date"></p>
                                    <p>End Time: <input type="time" id="end-time"></p>
                                    <p>
                                        <strong>Frequency:</strong><br><br>
                                        <input type="checkbox" id="Daily" name="frequency[]" value="Daily">
                                        <label for="Daily">Daily</label><br>

                                        <input type="checkbox" id="Weekdays" name="frequency[]" value="Weekdays">
                                        <label for="Weekdays">Weekdays</label><br>

                                        <input type="checkbox" id="Monday" name="frequency[]" value="Monday">
                                        <label for="Monday">Monday</label><br>

                                        <input type="checkbox" id="Tuesday" name="frequency[]" value="Tuesday">
                                        <label for="Tuesday">Tuesday</label><br>

                                        <input type="checkbox" id="Wednesday" name="frequency[]" value="Wednesday">
                                        <label for="Wednesday">Wednesday</label><br>

                                        <input type="checkbox" id="Thursday" name="frequency[]" value="Thursday">
                                        <label for="Thursday">Thursday</label><br>

                                        <input type="checkbox" id="Friday" name="frequency[]" value="Friday">
                                        <label for="Friday">Friday</label><br>

                                        <input type="checkbox" id="Saturday" name="frequency[]" value="Saturday">
                                        <label for="Saturday">Saturday</label><br>
                                    </p>
                                    <button class="create-button">Create</button>
                                    <button class="cancel-button">Cancel</button>
                                  `;
                  
                                  schedulePopup.innerHTML = schedulePopupContent;
                  
                                  // Add the schedule popup to the page
                                  document.body.appendChild(schedulePopup);
                  
                                  // Add a click event listener to the create button
                                  let createButton = schedulePopup.querySelector(".create-button");
                                    createButton.addEventListener("click", function() {
                                        // Get the schedule details
                                        let scheduleName = document.getElementById("schedule-name").value;
                                        let startDate = document.getElementById("start-date").value;
                                        let startTime = document.getElementById("start-time").value;
                                        let endDate = document.getElementById("end-date").value;
                                        let endTime = document.getElementById("end-time").value;

                                        let frequency = [];
                                        let checkboxes = document.getElementsByName("frequency[]");
                                        for (let i = 0; i < checkboxes.length; i++) {
                                            if (checkboxes[i].checked) {
                                                frequency.push(checkboxes[i].value);
                                            }
                                        }

                                        // Get the temp ID from the row
                                        let tempId = document.querySelector(`td[data-temp-id]`).dataset.tempId;

                                        console.log(`Temp ID: ${tempId}`);
                                        console.log(`Schedule Name: ${scheduleName}`);
                                        console.log(`Start Date: ${startDate}`);
                                        console.log(`Start Time: ${startTime}`);
                                        console.log(`End Date: ${endDate}`);
                                        console.log(`End Time: ${endTime}`);
                                        console.log(`Frequency: ${frequency}`);

                                        // Call the createShiftScheduleRecord function
                                        createShiftScheduleRecord(tempId, scheduleName, startDate, startTime, endDate, endTime, frequency, selectedAccountId, selectedDealId);

                                        // Close the popups
                                        dealPopup.remove();
                                        schedulePopup.remove();
                                        popup.remove();
                                    });
                                  // Add a click event listener to the cancel button
                                  let cancelButton = schedulePopup.querySelector(".cancel-button");
                                  cancelButton.addEventListener("click", function() {
                                    // Close the popups
                                    dealPopup.remove();
                                    schedulePopup.remove();
                                    popup.remove();
                                  });
                                });
                  
                                // Add a click event listener to the cancel button
                                let cancelButton = dealPopup.querySelector(".cancel-button");
                                cancelButton.addEventListener("click", function() {
                                  // Close the popups
                                  dealPopup.remove();
                                  popup.remove();
                                });
                              } else {
                                console.log("No deals found for the selected account");
                              }
                            })
                            .catch(function(error) {
                              console.error("Error fetching deals:", error);
                            });
                          });
                  
                          // Add a click event listener to the cancel button
                          let cancelButton = popup.querySelector(".cancel-button");
                          cancelButton.addEventListener("click", function() {
                            // Close the popup
                            popup.remove();
                          });
                        } else {
                          console.log("No accounts found.");
                        }
                      })
                      .catch(function(error) {
                        console.error("Error fetching accounts:", error);
                      });
                    });
                    cell.appendChild(plusButton);
                  }

                let threeDotsButton = createThreeDotsButton();
                threeDotsButton.addEventListener('click', handleThreeDotsButtonClick);
                cell.appendChild(threeDotsButton);

                let unavailabilityOptions = createUnavailabilityOptions(lead.id, cellDate);
                cell.appendChild(unavailabilityOptions);
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}


function fetchAndPopulateCalendar() {
    ZOHO.CRM.API.getAllRecords({ Entity: "Leads", sort_order: "desc", per_page: 200 })
        .then(function(response) {
            if (response.data && response.data.length > 0) {
                const leads = response.data.map(lead => ({
                    id: lead.id,
                    First_Name: lead.First_Name,
                    Last_Name: lead.Last_Name
                }));
                fetchAndPopulateSchedulesAndTimeOff(leads);
            } else {
                console.log("No leads found.");
                populateCalendarBody([], [], []);
            }
        })
        .catch(function(error) {
            console.error('Error fetching leads:', error);
            populateCalendarBody([], [], []);
        });
}

function fetchAndPopulateSchedulesAndTimeOff(leads) {
    const weekDates = getWeekDates(new Date(currentDate));
    const weekStartDate = moment(weekDates[0], 'MMM D, YYYY').format('YYYY-MM-DD');
    const weekEndDate = moment(weekDates[6], 'MMM D, YYYY').format('YYYY-MM-DD');

    const leadIds = leads.map(lead => lead.id);
    const leadIdsString = leadIds.join(",");

    const schedulePromise = ZOHO.CRM.API.getAllRecords({
        Entity: "Shift_Schedule",
        Criteria: `(Schedule_For_Temp:equals:${leadIdsString}) AND (Start_Date_and_Work_Start_Time:between:${weekStartDate}T00:00:00.000Z and ${weekEndDate}T23:59:59.999Z)`
    });

    const timeOffPromise = ZOHO.CRM.API.getAllRecords({
        Entity: "Time_Off",
        Criteria: `(Name1:equals:${leadIdsString}) AND ((From_Date_Time:between:${weekStartDate}T00:00:00.000Z and ${weekEndDate}T23:59:59.999Z) OR (Unavailable_day:between:${weekStartDate} and ${weekEndDate}))`
    });

    console.log('Fetching schedules and time-off records...');

    Promise.all([schedulePromise, timeOffPromise])
        .then(function([schedulesResponse, timeOffResponse]) {
            console.log('Schedules response:', schedulesResponse);
            console.log('Time-off response:', timeOffResponse);

            const schedules = schedulesResponse.data || [];
            const timeOffRecords = timeOffResponse.data || [];

            console.log('Schedules:', schedules);
            console.log('Time-off records:', timeOffRecords);

            populateCalendarBody(leads, schedules, timeOffRecords);
        })
        .catch(function(error) {
            console.error('Error fetching schedules or time-off records:', error);
            populateCalendarBody(leads, [], []);
        });
}

function insertTimeOffRecord(tempId, cellDate) {
    const timeOffRecord = {
        "Name1": { "id": tempId },
        "Unavailable_day": moment(cellDate).format('YYYY-MM-DD'),
        "Unavailability": "All Day"
    };

    ZOHO.CRM.API.insertRecord({ Entity: "Time_Off", APIData: timeOffRecord })
        .then(function(response) {
            if (response.data && response.data.length > 0 && response.data[0].code === "SUCCESS") {
                console.log('Time off record inserted successfully:', response.data);
                alert("All Day Unavailability Record created successfully! ");
                fetchAndPopulateCalendar(); // Refresh the calendar to show the updated data
            } else {
                console.error('Error inserting time off record:', response.data);
            }
        })
        .catch(function(error) {
            console.error('Error inserting time off record:', error);
        });
}
// Insert the new function here
function createShiftScheduleRecord(tempId, scheduleName, startDate, startTime, endDate, endTime, frequency, selectedAccountId, selectedDealId) {
    const startDateTime = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm').toDate();
    const endDateTime = moment(`${endDate} ${endTime}`, 'YYYY-MM-DD HH:mm').toDate();

    const shiftScheduleRecord = {
        "Schedule_For_Temp": tempId,
        "Client_Name": selectedAccountId,
        "Job": selectedDealId,
        "Name": scheduleName,
        "Start_Date_and_Work_Start_Time": moment(startDateTime).format('YYYY-MM-DDTHH:mm:ssZ'), // Format as ISO 8601 string
        "End_Date_and_Work_End_Time": moment(endDateTime).format('YYYY-MM-DDTHH:mm:ssZ'), // Format as ISO 8601 string
        //"Days_in_the_Week": frequency
    };

    ZOHO.CRM.API.insertRecord({ Entity: "Shift_Schedule", APIData: shiftScheduleRecord })
       .then(function(response) {
            console.log('Shift schedule record inserted successfully:', response); // Log the API response
            if (response.data && response.data.length > 0 && response.data[0].code === "SUCCESS") {
                console.log('Shift Schedule Record created successfully!');
                alert("Shift Schedule Record created successfully!");
                fetchAndPopulateCalendar(); // Refresh the calendar to show the updated data
            } else {
                console.error('Error creating Shift Schedule Record:', response.data);
                alert("Failed to create Shift Schedule Record: " + (response.data[0].message || "Unknown error"));
            }
        })
       .catch(function(error) {
            console.error('Error creating Shift Schedule Record:', error);
            alert('An error occurred while creating the Shift Schedule Record. Check the console for details.');
        });
}

let hourlyUnavailabilityPopup;
let backdropElement;

function markUnavailableHourly(tempId, cellDate) {
    // Remove any existing popup
    if (hourlyUnavailabilityPopup) {
        hourlyUnavailabilityPopup.remove();
    }

    const cell = document.querySelector(`td[data-time*='${moment(cellDate).format('MMM D, YYYY')}']`);
    if (cell) {
        // Create a backdrop element to blur the background
        backdropElement = document.createElement('div');
        backdropElement.className = 'backdrop';
        document.body.appendChild(backdropElement);

        // Create a small popup
        hourlyUnavailabilityPopup = document.createElement('div');
        hourlyUnavailabilityPopup.className = 'hourly-unavailability-popup';
        hourlyUnavailabilityPopup.innerHTML = `
            <input type="date" id="unavailable-date" value="${moment(cellDate).format('YYYY-MM-DD')}">
            <input type="time" id="unavailable-start-time">
            <input type="time" id="unavailable-end-time">
            <button id="save-hourly-unavailability" style="font-size: 12px;">Save</button>
            <button id="cancel-hourly-unavailability" style="font-size: 12px;">Cancel</button>
            <div id="error-message"></div>
        `;

        // Center the popup
        hourlyUnavailabilityPopup.style.position = 'fixed';
        hourlyUnavailabilityPopup.style.top = '50%';
        hourlyUnavailabilityPopup.style.left = '50%';
        hourlyUnavailabilityPopup.style.transform = 'translate(-50%, -50%)';
        hourlyUnavailabilityPopup.style.zIndex = '1';

        document.body.appendChild(hourlyUnavailabilityPopup);

        // Add event listeners
        document.getElementById('save-hourly-unavailability').addEventListener('click', () => {
            const date = document.getElementById('unavailable-date').value;
            const startTime = document.getElementById('unavailable-start-time').value;
            const endTime = document.getElementById('unavailable-end-time').value;
            const errorMessage = document.getElementById('error-message');

            // Validate input fields
            if (!date || !startTime || !endTime) {
                errorMessage.innerText = 'Please fill in all fields.';
                return;
            }

            // Check if start time is before end time
            if (moment(startTime, 'HH:mm').isAfter(moment(endTime, 'HH:mm'))) {
                errorMessage.innerText = 'Start time cannot be after end time.';
                return;
            }

            // Check if selected date is in the past
            if (moment(date).isBefore(moment())) {
                errorMessage.innerText = 'Cannot mark unavailability for a past date.';
                return;
            }

            // Update cell for hourly unavailability
            function updateCellForHourlyUnavailability(tempId, cellDate, startTime, endTime) {
                let formattedCellDate = moment(cellDate).format('YYYY-MM-DD');
                let formattedStartTime = moment(`${formattedCellDate} ${startTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DDTHH:mm:ss');
                let formattedEndTime = moment(`${formattedCellDate} ${endTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DDTHH:mm:ss');
            
                var recordData = {
                    "Name1": tempId,
                    "Unavailability": "Hourly",
                    "From_Date_Time": formattedStartTime,
                    "To_Date": formattedEndTime
                };
            
                ZOHO.CRM.API.insertRecord({ Entity: "Time_Off", APIData: recordData, Trigger: [] })
                  .then(function(data) {
                      console.log("Insert Response: ", data);
                      if (data.data && data.data.length > 0 && data.data[0].code === "SUCCESS") {
                          alert("Hourly Unavailability Record created successfully! ");
                          let cellSelector = `td[data-time*='${moment(cellDate).format('MMM D, YYYY')}'][data-temp-id='${tempId}']`;
                          let cell = document.querySelector(cellSelector);
                          if (cell) {
                              cell.innerHTML = `Unavailable (${startTime} - ${endTime})`;
                              cell.classList.add('unavailable'); // Mark the cell as unavailable
                          }
                          fetchAndPopulateCalendar(); // Call this function to re-render the calendar
                      } else {
                          alert("Failed to create Hourly Unavailability Record: " + (data.data[0].message || "Unknown error"));
                      }
                  })
                  .catch(function(error) {
                      console.error('Error inserting Hourly Unavailability Record:', error);
                      alert('An error occurred while creating the Hourly Unavailability Record. Check the console for details. ');
                  });
            }

            updateCellForHourlyUnavailability(tempId, cellDate, startTime, endTime);
            hourlyUnavailabilityPopup.remove(); // Remove the popup
            backdropElement.remove(); // Remove the backdrop
        });

        document.getElementById('cancel-hourly-unavailability').addEventListener('click', () => {
            hourlyUnavailabilityPopup.remove(); // Remove the popup
            backdropElement.remove(); // Remove the backdrop
        });
    }
}



$(document).ready(function() {
    ZOHO.embeddedApp.on("PageLoad", function(data) {
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    ZOHO.embeddedApp.init();

    document.getElementById('prevWeek').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 7);
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    document.getElementById('nextWeek').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 7);
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    document.getElementById('currentWeek').addEventListener('click', function() {
        currentDate = new Date(today);
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    document.addEventListener('click', function(event) {
        let options = document.querySelectorAll('.unavailability-options');
        options.forEach(option => {
            if (!option.contains(event.target) && !event.target.classList.contains('three-dots-button')) {
                option.style.display = 'none';
            }
        });
    });
});

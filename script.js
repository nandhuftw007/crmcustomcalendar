document.addEventListener('DOMContentLoaded', function() {
    var buttonsModal = document.getElementById('buttonsModal');
    var tempModal = document.getElementById('tempModal');
    var shiftModal = document.getElementById('shiftModal');
    var fetchAccountsBtn = document.getElementById('fetchAccountsBtn');
    var swapShiftsBtn = document.getElementById('swapShiftsBtn');
    var swapTempsBtn = document.getElementById('swapTempsBtn');
    var closeButtons = document.querySelectorAll('.close');
    var tempData = [];
    var shiftData = [];
    var tempshiftData = [];
    var selectedRecordId = null;
    var selectedShiftIds = [];
    var currentPage = 1;
    var recordsPerPage = 10;
    let maxSelections = 2;

    function closeModals() {
        if (buttonsModal) buttonsModal.style.display = "none";
        if (tempModal) tempModal.style.display = "none";
        if (shiftModal) shiftModal.style.display = "none";

        // Clear temporary data and reset state
        tempData = [];
        shiftData = [];
        tempshiftData = [];
        selectedRecordId = null;
        selectedShiftIds = [];
        currentPage = 1;

        // Clear search boxes
        if (document.getElementById('searchBox')) {
            document.getElementById('searchBox').value = '';
        }
        if (document.getElementById('searchBoxShift')) {
            document.getElementById('searchBoxShift').value = '';
        }
       

        // Clear and reset any table data
        if (document.getElementById('tempshiftContainer')) {
            document.getElementById('tempshiftContainer').innerHTML = '';
        }
        if (document.getElementById('shiftContainer')) {
            document.getElementById('shiftContainer').innerHTML = '';
        }
        
        // Remove event listeners if needed
        document.querySelectorAll('.shift-checkbox').forEach(checkbox => {
            checkbox.removeEventListener('change', handleShiftSelection);
        });

        // Hide any submit buttons
        toggleSubmitButtonVisibility();
        toggleSubmitShiftButtonVisibility();
    }

    function setupCloseButtons() {
        closeButtons.forEach(function(button) {
            button.onclick = function() {
                closeModals();
            }
        });
    }

    setupCloseButtons();

    window.onclick = function(event) {
        if (event.target === buttonsModal || event.target === tempModal || event.target === shiftModal ) {
            closeModals();
        }
    }

    if (fetchAccountsBtn) {
        fetchAccountsBtn.addEventListener('click', function() {
            buttonsModal.style.display = "block"; // Show the buttons modal
        });
    }
    if (swapTempsBtn) {
        swapTempsBtn.addEventListener('click', function() {
            console.log("Swap Temp Shifts button clicked");
            buttonsModal.style.display = "none"; // Hide the buttons modal
            tempModal.style.display = "block"; // Show the temp modal
    
            ZOHO.CRM.API.getAllRecords({
                Entity: "Shift_Schedule",
                sort_order: "asc",
                per_page: 200
            }).then(function(response) {
                console.log("API response received:", response);
    
                if (response.data && response.data.length > 0) {
                    tempshiftData = response.data.map(shift => ({
                        id: shift.id || '',
                        Name: shift.Name || '',
                        Start_Date_and_Work_Start_Time: shift.Start_Date_and_Work_Start_Time || '',
                        End_Date_and_Work_End_Time: shift.End_Date_and_Work_End_Time || '',
                        Days_in_the_Week: shift.Days_in_the_Week || '',
                        Schedule_For_Temp: shift.Schedule_For_Temp || {} // Ensure it's an object
                    }));
                    console.log("Temp Shifts data processed:", tempshiftData);
    
                    displayshiftTempPage(currentPage);
                } else {
                    console.log("No temp shift data found");
                }
            }).catch(function(error) {
                console.error("Error fetching temp shift data:", error);
            });
        });
    }



    

    ////////////////////////////////
    if (nextButtontemp) {
        nextButtontemp.addEventListener('click', async function() {
            buttonsModal.style.display = "none";
            tempModal.style.display = "block";
    
            try {
                // Fetch the details of the specific shift using the Shift ID
                const shiftID = '6336174000001396001'; // Provided Shift ID
                const shiftResponse = await ZOHO.CRM.API.getRecord({
                    Entity: "Shift_Schedule",
                    RecordID: shiftID
                });
    
                const providedShift = shiftResponse.data[0];
                const providedShiftStartDate = moment(providedShift['Start_Date_and_Work_Start_Time']);
                const providedShiftEndDate = moment(providedShift['End_Date_and_Work_End_Time']);
                const providedShiftDays = providedShift['Days_in_the_Week'].map(day => day.toLowerCase());
                const providedShiftStartTime = moment(providedShift['Start_Date_and_Work_Start_Time']).format('HH:mm');
                const providedShiftEndTime = moment(providedShift['End_Date_and_Work_End_Time']).format('HH:mm');
    
                // Log the details of the provided shift
                console.log("Shift provided:", {
                    id: shiftID,
                    Start_Date_and_Work_Start_Time: providedShiftStartDate.format('YYYY-MM-DD'),
                    End_Date_and_Work_End_Time: providedShiftEndDate.format('YYYY-MM-DD'),
                    Days_in_the_Week: providedShiftDays,
                    Start_Time: providedShiftStartTime,
                    End_Time: providedShiftEndTime
                });
    
                // Fetch all shifts
                const allShiftsResponse = await ZOHO.CRM.API.getAllRecords({
                    Entity: "Shift_Schedule",
                    sort_order: "asc",
                    per_page: 200
                });
    
                const allShifts = allShiftsResponse.data;
    
                // Filter out the provided shift from all shifts
                const filteredShifts = allShifts.filter(shift => shift.id !== shiftID);
    
                // Function to check if two date ranges overlap
                function doDatesOverlap(date1, date2) {
                    const start1 = moment(date1.startDate);
                    const end1 = moment(date1.endDate);
                    const start2 = moment(date2.startDate);
                    const end2 = moment(date2.endDate);
    
                    return start1.isBefore(end2) && end1.isAfter(start2);
                }
    
                // Function to check if two shifts overlap
                function doShiftsOverlap(shift1, shift2) {
                    const shift1Dates = getWorkingDatesAndTimes(
                        shift1.startDate,
                        shift1.endDate,
                        shift1.startTime,
                        shift1.endTime,
                        shift1.workingDays
                    );
                    const shift2Dates = getWorkingDatesAndTimes(
                        shift2.startDate,
                        shift2.endDate,
                        shift2.startTime,
                        shift2.endTime,
                        shift2.workingDays
                    );
    
                    return shift1Dates.some(date1 => 
                        shift2Dates.some(date2 => 
                            date1.date === date2.date && doDatesOverlap(date1, date2)
                        )
                    );
                }
    
                // List working dates and times
                function getWorkingDatesAndTimes(startDate, endDate, startTime, endTime, workingDays) {
                    let workingDates = [];
                    let currentDay = moment(startDate);
                    while (currentDay.isSameOrBefore(endDate)) {
                        if (isWorkingDay(currentDay, workingDays)) {
                            workingDates.push({
                                date: currentDay.format('YYYY-MM-DD'),
                                startTime: startTime,
                                endTime: endTime
                            });
                        }
                        currentDay.add(1, 'days');
                    }
                    return workingDates;
                }
    
                // Function to check if a date is a working day based on the Days_in_the_Week value
                function isWorkingDay(date, workingDays) {
                    const dayOfWeek = date.format('dddd').toLowerCase();
                    if (workingDays.includes('daily')) return true;
                    if (workingDays.includes('weekend')) return !['saturday', 'sunday'].includes(dayOfWeek);
                    return workingDays.includes(dayOfWeek) ||
                           (workingDays.includes('weekdays') && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayOfWeek));
                }
    
                let providedShiftWorkingDates = getWorkingDatesAndTimes(providedShiftStartDate, providedShiftEndDate, providedShiftStartTime, providedShiftEndTime, providedShiftDays);
                console.log("Working Dates and Times for Provided Shift:", providedShiftWorkingDates);
    
                // Filter shifts that need to be checked and overlap with the provided shift
                const overlappingShifts = filteredShifts.filter(shift => {
                    const shiftStart = moment(shift['Start_Date_and_Work_Start_Time']);
                    const shiftEnd = moment(shift['End_Date_and_Work_End_Time']);
                    const shiftDays = shift['Days_in_the_Week'].map(day => day.toLowerCase());
                    const shiftStartTime = moment(shift['Start_Date_and_Work_Start_Time']).format('HH:mm');
                    const shiftEndTime = moment(shift['End_Date_and_Work_End_Time']).format('HH:mm');
    
                    const shiftToCheck = {
                        startDate: shiftStart.format('YYYY-MM-DD'),
                        endDate: shiftEnd.format('YYYY-MM-DD'),
                        workingDays: shiftDays,
                        startTime: shiftStartTime,
                        endTime: shiftEndTime
                    };
    
                    const overlap = doShiftsOverlap({
                        startDate: providedShiftStartDate.format('YYYY-MM-DD'),
                        endDate: providedShiftEndDate.format('YYYY-MM-DD'),
                        workingDays: providedShiftDays,
                        startTime: providedShiftStartTime,
                        endTime: providedShiftEndTime
                    }, shiftToCheck);
    
                    // Get the working dates and times for this shift
                    const shiftWorkingDates = getWorkingDatesAndTimes(shiftStart, shiftEnd, shiftStartTime, shiftEndTime, shiftDays);
    
                    // Log shift details including ID and working dates
                    console.log("Checking shift:", {
                        id: shift.id,
                        startDate: shiftStart.format('YYYY-MM-DD'),
                        endDate: shiftEnd.format('YYYY-MM-DD'),
                        workingDays: shiftDays,
                        Start_Time: shiftStartTime,
                        End_Time: shiftEndTime,
                        Working_Dates_and_Times: shiftWorkingDates,
                        overlap: overlap
                    });
    
                    return overlap;
                });
    
                // Log shifts that overlap with the provided shift
                console.log("Overlapping Shifts:");
                overlappingShifts.forEach(shift => {
                    const shiftStart = moment(shift['Start_Date_and_Work_Start_Time']);
                    const shiftEnd = moment(shift['End_Date_and_Work_End_Time']);
                    const shiftDays = shift['Days_in_the_Week'].map(day => day.toLowerCase());
                    const shiftStartTime = moment(shift['Start_Date_and_Work_Start_Time']).format('HH:mm');
                    const shiftEndTime = moment(shift['End_Date_and_Work_End_Time']).format('HH:mm');
    
                    // Get the working dates and times for this shift
                    const shiftWorkingDates = getWorkingDatesAndTimes(shiftStart, shiftEnd, shiftStartTime, shiftEndTime, shiftDays);
    
                    console.log({
                        id: shift.id,
                        Start_Date_and_Work_Start_Time: shiftStart.format('YYYY-MM-DD'),
                        End_Date_and_Work_End_Time: shiftEnd.format('YYYY-MM-DD'),
                        Days_in_the_Week: shiftDays,
                        Working_Dates_and_Times: shiftWorkingDates
                    });
                });
    
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        });
    } else {
        console.error("Swap Temps button not found");
    }
     
    
    
    
    
    
    
      
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
        
    
    
    
    
    
    
       
    
    

    
         
    






    /////////////////////////////////
    // Search function for seaching temp alone page 

    if (document.getElementById('searchBoxTempOnly')) {
        document.getElementById('searchBoxTempOnly').addEventListener('input', function(event) {
            const searchQuery = event.target.value.toLowerCase();
            const filteredData = tempData.filter(temp => 
                (temp.First_Name + ' ' + temp.Last_Name).toLowerCase().includes(searchQuery)
            );
            displayTempdataPage(1, filteredData); // Reset to the first page of filtered results
        });
    }


    // Search function for Swap temps button

    if (document.getElementById('searchBoxShifttemp')) {
        document.getElementById('searchBoxShifttemp').addEventListener('input', function(event) {
            const searchQuery = event.target.value.toLowerCase();
            const filteredData = tempshiftData.filter(shift => 
                (shift.Name).toLowerCase().includes(searchQuery)
            );
            displayShiftPage(1, filteredData); // Reset to the first page of filtered results
        });
    }
    if (document.getElementById('searchBoxTemptemp')) {
        document.getElementById('searchBoxTemptemp').addEventListener('input', function(event) {
            const searchQuery = event.target.value.toLowerCase();
            const filteredData = tempshiftData.filter(shift => 
                (shift.Schedule_For_Temp && shift.Schedule_For_Temp.name ? shift.Schedule_For_Temp.name : '').toLowerCase().includes(searchQuery)
            );
            displayShiftPage(1, filteredData); // Reset to the first page of filtered results
        });
    }
    

    if (swapShiftsBtn) {
        swapShiftsBtn.addEventListener('click', function() {
            console.log("Swap Shifts button clicked");
            buttonsModal.style.display = "none"; // Hide the buttons modal
            shiftModal.style.display = "block"; // Show the shift modal

            ZOHO.CRM.API.getAllRecords({
                Entity: "Shift_Schedule",
                sort_order: "asc",
                per_page: 200
            }).then(function(response) {
                console.log("API response received:", response);

                if (response.data && response.data.length > 0) {
                    shiftData = response.data.map(shift => ({
                        id: shift.id || '',
                        Name: shift.Name || '',
                        Start_Date_and_Work_Start_Time: shift.Start_Date_and_Work_Start_Time || '',
                        End_Date_and_Work_End_Time: shift.End_Date_and_Work_End_Time || '',
                        Days_in_the_Week: shift.Days_in_the_Week || '',
                        Schedule_For_Temp: shift.Schedule_For_Temp || {} // Ensure it's an object
                    }));
                    console.log("Shifts data processed:", shiftData);

                    displayShiftPage(currentPage);
                } else {
                    console.log("No shift data found");
                }
            }).catch(function(error) {
                console.error("Error fetching shift data:", error);
            });
        });
    } else {
        console.error("Swap Shifts button not found");
    }

    if (document.getElementById('prevPageBtn')) {
        document.getElementById('prevPageBtn').addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayshiftTempPage(currentPage);
            }
        });
    } else {
        console.error("Previous Page button for temp not found");
    }

    if (document.getElementById('nextPageBtn')) {
        document.getElementById('nextPageBtn').addEventListener('click', function() {
            if (currentPage * recordsPerPage < tempData.length) {
                currentPage++;
                displayshiftTempPage(currentPage);
            }
        });
    } else {
        console.error("Next Page button for temp not found");
    }

    if (document.getElementById('prevShiftPageBtn')) {
        document.getElementById('prevShiftPageBtn').addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayShiftPage(currentPage);
            }
        });
    } else {
        console.error("Previous Page button for shift not found");
    }

    // Function to display the success message modal
    function showSuccessModal(message) {
        var successModal = document.getElementById('successModal');
        var successMessage = document.getElementById('successMessage');

        if (successMessage) {
            successMessage.textContent = message;
        }

        if (successModal) {
            successModal.style.display = "block";
        }
    }

    // Update the code where you handle the successful shift swap
    if (document.getElementById('submitShiftBtn')) {
        document.getElementById('submitShiftBtn').addEventListener('click', function() {
            if (selectedShiftIds.length === 2) {
                // Get the selected shifts
                const selectedShifts = shiftData.filter(shift => selectedShiftIds.includes(shift.id));
                
                if (selectedShifts.length === 2) {
                    const [shift1, shift2] = selectedShifts;

                    // Log both Shift ID and Schedule_For_Temp.id for each selected shift
                    console.log(`Shifts to swap:`);
                    console.log(`Shift 1 ID: ${shift1.id}, Temp ID: ${shift1.Schedule_For_Temp ? shift1.Schedule_For_Temp.id : 'N/A'}`);
                    console.log(`Shift 2 ID: ${shift2.id}, Temp ID: ${shift2.Schedule_For_Temp ? shift2.Schedule_For_Temp.id : 'N/A'}`);

                    // Perform swap
                    const tempId1 = shift1.Schedule_For_Temp ? shift1.Schedule_For_Temp.id : null;
                    const tempId2 = shift2.Schedule_For_Temp ? shift2.Schedule_For_Temp.id : null;

                    if (tempId1 === null || tempId2 === null) {
                        showSuccessModal("Both selected shifts must have associated temps.");
                        return;
                    }

                    // Prepare data for updating
                    const updates = [
                        { id: shift1.id, Schedule_For_Temp: { id: tempId2 } },
                        { id: shift2.id, Schedule_For_Temp: { id: tempId1 } }
                    ];

                    // Log the data being sent to API
                    console.log("Data to be updated:", updates);

                    Promise.all(updates.map(update => {
                        console.log("Updating shift:", update); // Log each update
                        return ZOHO.CRM.API.updateRecord({
                            Entity: "Shift_Schedule",
                            RecordID: update.id,
                            APIData: update
                        }).then(response => {
                            console.log(`Update response for Shift ID ${update.id}:`, response);
                            return response; // Return the response to handle success
                        }).catch(error => {
                            console.error(`Error updating Shift ID ${update.id}:`, error);
                            if (error && error.data) {
                                console.error("Detailed error data:", error.data);
                            }
                            throw error; // Throw error to handle in Promise.all
                        });
                    }))
                    .then(responses => {
                        console.log("All updates successful:", responses);
                        showSuccessModal("Shifts Swapped Successfully.");
                        closeModals();
                    })
                    .catch(function(error) {
                        console.error("Error updating shifts:", error);
                        if (error && error.data) {
                            console.error("Detailed error data:", error.data);
                        }
                        showSuccessModal("Failed to update shifts. Please try again.");
                    });
                } else {
                    showSuccessModal("Please select exactly two shifts for swapping.");
                }
            } else {
                showSuccessModal("Please select exactly two shifts.");
            }
        });
    } else {
        console.error("Submit button for shift not found");
    }

    // Add an event listener to close the success modal
    document.querySelector('#successModal .close').addEventListener('click', function() {
        document.getElementById('successModal').style.display = 'none';
    });

    // Search fucntion for Swap Shifts

    if (document.getElementById('searchBoxShift')) {
        document.getElementById('searchBoxShift').addEventListener('input', function(event) {
            const searchQuery = event.target.value.toLowerCase();
            const filteredData = shiftData.filter(shift => 
                (shift.Name).toLowerCase().includes(searchQuery)
            );
            displayShiftPage(1, filteredData); // Reset to the first page of filtered results
        });
    }
    if (document.getElementById('searchBoxTemp')) {
        document.getElementById('searchBoxTemp').addEventListener('input', function(event) {
            const searchQuery = event.target.value.toLowerCase();
            const filteredData = shiftData.filter(shift => 
                (shift.Schedule_For_Temp && shift.Schedule_For_Temp.name ? shift.Schedule_For_Temp.name : '').toLowerCase().includes(searchQuery)
            );
            displayShiftPage(1, filteredData); // Reset to the first page of filtered results
        });
    }

    // Fucntion for Swap Temp shift

    function displayshiftTempPage(page, data = tempshiftData) {
        const container = document.getElementById('tempshiftContainer');
        const nextButtontemp = document.getElementById('nextButtontemp');
        
        if (!container) {
            console.error("Temp Shift container element not found");
            return;
        }
        
        container.innerHTML = ''; // Clear existing options
        console.log("Temp Shift container cleared");
        
        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pagedData = data.slice(start, end);
        
        pagedData.forEach((shift, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shift.Name}</td>
                <td>${shift.Schedule_For_Temp ? shift.Schedule_For_Temp.name : 'N/A'}</td>
                <td>${shift.Start_Date_and_Work_Start_Time}</td>
                <td>${shift.End_Date_and_Work_End_Time}</td>
                <td>${shift.Days_in_the_Week}</td>
                <td>
                    <input type="radio" name="shift" value="${shift.id}" class="shift-radio" />
                </td>
            `;
            
            container.appendChild(row);
        });
        
        // Add event listener to handle radio button selection
        document.querySelectorAll('.shift-radio').forEach(radio => {
            radio.addEventListener('change', handleRadioSelection);
        });
        
        
        console.log("Temp Shift data populated");
    }
    
    function handleRadioSelection(event) {
        const selectedRadio = document.querySelector('.shift-radio:checked');
        const nextButtontemp = document.getElementById('nextButtontemp');
        
        if (nextButtontemp) {
            if (selectedRadio) {
                nextButtontemp.style.display = 'block'; // Show "Next" button if exactly one radio button is selected
            } else {
                nextButtontemp.style.display = 'none'; // Hide "Next" button if no radio button is selected
            }
        }
    }

     // Function to display the temp data

     function displayTempdataPage(page, data = tempData) {
        const container = document.getElementById('accountRadioContainer');
        if (!container) {
            console.error("Radio container element not found");
            return;
        }

        container.innerHTML = ''; // Clear existing options
        console.log("Radio container cleared");

        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pagedData = data.slice(start, end);

        pagedData.forEach(temp => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'account';
            radio.value = temp.id;

            radio.addEventListener('change', function() {
                selectedRecordId = radio.value;
                toggleSubmitButtonVisibility();
            });

            const firstName = temp.First_Name || '';
            const lastName = temp.Last_Name || '';
            const name = (firstName || lastName) ? (firstName + (firstName && lastName ? ' ' : '') + lastName) : 'Unnamed';

            label.appendChild(radio);
            label.appendChild(document.createTextNode(name + " " + temp.id));
            container.appendChild(label);
            container.appendChild(document.createElement('br')); // For better spacing
        });

        console.log("Radio buttons populated with temp data");
    }

    // Fucntion to display shift for Swap Shifts 

    function displayShiftPage(page, data = shiftData) {
        const container = document.getElementById('shiftContainer');
        if (!container) {
            console.error("Shift container element not found");
            return;
        }

        container.innerHTML = ''; // Clear existing options
        console.log("Shift container cleared");

        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pagedData = data.slice(start, end);

        pagedData.forEach(shift => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shift.Name}</td>
                <td>${shift.Schedule_For_Temp ? shift.Schedule_For_Temp.name : 'N/A'}</td>
                <td>${shift.Start_Date_and_Work_Start_Time}</td>
                <td>${shift.End_Date_and_Work_End_Time}</td>
                <td>${shift.Days_in_the_Week}</td>
                <td>
                    <input type="checkbox" name="shift" value="${shift.id}" class="shift-checkbox" />
                </td>
            `;

            container.appendChild(row);
        });

        document.querySelectorAll('.shift-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleShiftSelection);
        });

        console.log("Shift data populated");
    }

    function handleShiftSelection(event) {
        const checkbox = event.target;
        const shiftId = checkbox.value;

        if (checkbox.checked) {
            if (selectedShiftIds.length >= maxSelections) {
                checkbox.checked = false;
                alert('You can only select up to two shifts.');
            } else {
                selectedShiftIds.push(shiftId);
            }
        } else {
            selectedShiftIds = selectedShiftIds.filter(id => id !== shiftId);
        }

        toggleSubmitShiftButtonVisibility();
    }
   

    function toggleSubmitButtonVisibility() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.style.display = selectedRecordId ? 'block' : 'none';
    }

    function toggleSubmitShiftButtonVisibility() {
        const submitShiftBtn = document.getElementById('submitShiftBtn');
        submitShiftBtn.style.display = selectedShiftIds.length === maxSelections ? 'block' : 'none';
    }

    ZOHO.embeddedApp.init().then(function() {
        console.log("Zoho Embedded App SDK initialization completed");
    }).catch(function(error) {
        console.error("Zoho Embedded App SDK initialization error:", error);
    });
});


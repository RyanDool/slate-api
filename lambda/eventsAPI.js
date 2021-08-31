'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

const 
	S3 = new AWS.S3(),
	params = {
		Bucket: 'emcvirtualevents',
		Key: 'events/allSlateEventsRaw.json',
		ResponseContentType: 'application/json'
	};

	class Events {
		/**
		 * Events constructor
		 * 
		 * allEvents -  will retain unmutated object of all events with keys being calendar dates MM/DD/YYYY.
		 * 
		 * eventsList - will mutate based on method calls, but will still retain the same structure as allEvents.
		 * 
		 * @param {Object} events - JSON containing campus events
		 */
		constructor(events){
			this.allEvents = this.structureEvents(events);
			this.eventsList = this.allEvents;
		}

		/**
	 	* Builds an object with keys being dates, containing an array of event objects.
	 	* @param {Object} events  - JSON containing campus events
	 	* @returns Object of events with keys being calendar dates MM/DD/YYYY
	 	*/
		structureEvents(events){
			let tempEventsObj = {};
			events.row.map(vritualEvent => {
				let eventStartDate = vritualEvent.StartDate;
				(eventStartDate in tempEventsObj) ? tempEventsObj[eventStartDate].push(vritualEvent) : tempEventsObj[eventStartDate] = [vritualEvent];
			}, this);
			return this.sortEvents(tempEventsObj);
		}
		
		/**
	 	* Sorts events object by date in ascending order.
	 	* @param {Object} theEvents  - JSON containing campus events with keys being calendar dates MM/DD/YYYY
	 	* @returns Ordered object by key in ascending order.
	 	*/
		sortEvents(theEvents){
			const retEventsSorted = {};
			Object.keys(theEvents)
						.sort()
						.forEach((key) => {retEventsSorted[key] = theEvents[key];});
			return retEventsSorted;
		}
		
		/**
		 * Getter to get an object of all events
		 * @returns allEvents, an object with keys being dates, containing an array of event objects.
		 */
		getAllEvents(){
			return this.allEvents;
		}
		
		/**
	 	* Getter to get an object of events after any filtering mutuations.
	 	* @returns eventsList, an object with keys being dates, containing an array of event objects.
	 	*/
		getEvents(){
			return this.eventsList;
		}

		/**
	 	* Removes all events from eventsList which do not occure within the month provided by the parameter mm.
	 	* @param {String} mm - a two character string representing the month e.g. August would be 08 
	 	*/
		eventsByMonth(mm){
			let tempEventsObj = {};
			Object.keys(this.eventsList)
						.forEach((key) => {
							if(key.substr(0, 2) === mm){
								tempEventsObj[key] = this.eventsList[key];
							}
						});
			this.eventsList = tempEventsObj;
		}

		/**
	 	* Removes all events from eventsList which do not occure on the day provided by the parameter dd.
	 	* @param {String} dd - a two character string representing the day, for single digit days, add a preceeding zero.
	 	*/		
		eventsByDay(dd){
			let tempEventsObj = {};
			Object.keys(this.eventsList)
						.forEach((key) => {
							if(key.substr(3, 2) === dd){
								tempEventsObj[key] = this.eventsList[key];
							}
						});		
			this.eventsList = tempEventsObj;
		}
		
		/**
	 	* Removes all events from eventsList which do not occure in the year provided by the parameter yr.
	 	* @param {String} yr - a four character string representing the year.
	 	*/	
		eventsByYear(yr){
			let tempEventsObj = {};
			Object.keys(this.eventsList)
						.forEach((key) => {
							if(key.substr(6, 4) === yr){
								tempEventsObj[key] = this.eventsList[key];
							}
						});
			this.eventsList = tempEventsObj;
		}
		
		/**
		 * Removes all events from eventsList which do not contain a "Y" value for the supplied audience parameter.
		 * @param {String} audience - accepts "TREvent" (transfer Event) or "FYEvent" (First-Year Event).
		 */
		eventsByAudience(audience){
			let tempEventsObj = {};
			Object.keys(this.eventsList).forEach((key) => {
  			this.eventsList[key].map(evnt => {
					if(audience === "TREvent" && evnt.TREvent === "Y"){
						tempEventsObj[key] ? tempEventsObj[key].push(evnt) : tempEventsObj[key] = [evnt];
					}
					if(audience === "FYEvent" && evnt.FYEvent === "Y"){
						tempEventsObj[key] ? tempEventsObj[key].push(evnt) : tempEventsObj[key] = [evnt];
					}
  			});
			});
			this.eventsList = tempEventsObj;
		}
		
		/**
	 	* Removes all events from eventsList which do not contain a "Y" value for the SPOTLIGHTEvent key.
	 	*/	
		spotlightEvents(){
			let tempEventsObj = {};
			Object.keys(this.eventsList).forEach((key) => {
  			this.eventsList[key].map(evnt => {
					if(evnt.SPOTLIGHTEvent === "Y"){
						tempEventsObj[key] ? tempEventsObj[key].push(evnt) : tempEventsObj[key] = [evnt];
					}
  			});
			});
			
			this.eventsList = tempEventsObj;
		}
		
		/**
		 * Removes all events from eventsList which do not contain a "Y" value for the VIRTUALEvent key.
		 */
		virtualEvents(){
			let tempEventsObj = {};
			Object.keys(this.eventsList).forEach((key) => {
  			this.eventsList[key].map(evnt => {
					if(evnt.VIRTUALEvent === "Y"){
						tempEventsObj[key] ? tempEventsObj[key].push(evnt) : tempEventsObj[key] = [evnt];
					}
  			});
			});
			this.eventsList = tempEventsObj;
		}
		
		/**
		 * Removes all events from eventsList which do not contain a "Y" value for the INPERSONEvent key.
		 */
		inPersonEvents(){
			let tempEventsObj = {};
			Object.keys(this.eventsList).forEach((key) => {
  			this.eventsList[key].map(evnt => {
					if(evnt.INPERSONEvent === "Y"){
						tempEventsObj[key] ? tempEventsObj[key].push(evnt) : tempEventsObj[key] = [evnt];
					}
  			});
			});
			this.eventsList = tempEventsObj;
		}

		/**
	 	* Removes all events from eventsList which do not have a value for Category matching the provided parameter category.
	 	* @param {String} category - some events are identified by category.
	 	*/	
		eventsByCategory(category){
			let tempEventsObj = {};
			Object.keys(this.eventsList).forEach((key) => {
  			this.eventsList[key].map(evnt => {
					if(evnt.Category === category){
						tempEventsObj[key] ? tempEventsObj[key].push(evnt) : tempEventsObj[key] = [evnt];
					}
				});
			});
			this.eventsList = tempEventsObj;
		}
	}

exports.handler = async (event, context) => {
	try{
		const data = (await (S3.getObject(params).promise())).Body.toString('utf-8');
		let virtualEvents = new Events(JSON.parse(data.replace(/\\n/g, '')));

		if(event.month){
			virtualEvents.eventsByMonth(event.month);
		}	
		if(event.day){
			virtualEvents.eventsByDay(event.day);
		}
		if(event.year){
			virtualEvents.eventsByYear(event.year);
		}
		if(event.audience){
			virtualEvents.eventsByAudience(event.audience);
		}
		if(event.spotlight){
			virtualEvents.spotlightEvents();
		}
		if(event.virtual){
			virtualEvents.virtualEvents();
		}
		if(event.inperson){
			virtualEvents.inPersonEvents();
		}
		if(event.category){
			virtualEvents.eventsByCategory(event.category);
		}
			
		
		let finalEvents = virtualEvents.getEvents();

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
			body: finalEvents
		};
	} 
	catch(err){
		console.log(err);
		const message = `Error getting object ${params.Key} from bucket ${params.Bucket}. Make sure they exist and your bucket is in the same region as this function.`;
		console.log(message);
		throw new Error(message);
	}
};
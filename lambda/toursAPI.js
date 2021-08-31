'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

const 
	S3 = new AWS.S3(),
	params = {
		Bucket: 'slateapi',
		Key: 'tours/allSlateToursRaw.json',
		ResponseContentType: 'application/json'
	};

class Tours {
	/**
	 * Tours constructor
	 * 
	 * allTours -  will retain unmutated object of all tours with keys being calendar dates MM/DD/YYYY.
	 * 
	 * tourList - will mutate based on method calls, but will still retain the same structure as allTours.
	 * 
	 * @param {Object} tours - JSON containing campus tours
	 */
	constructor(tours){
		this.allTours = this.structureTours(tours);
		this.toursList = this.allTours;
	}


	/**
	 * Builds an object with keys being dates, containing an array of tour objects.
	 * @param {Object} tours  - JSON containing campus tours
	 * @returns Object of tours with keys being calendar dates MM/DD/YYYY
	 */
	structureTours(tours){
		let tempTours = {};
		tours.row.map(tour => {
			let tourStartDate = tour.StartDate;
			(tourStartDate in tempTours) ? tempTours[tourStartDate].push(tour) : tempTours[tourStartDate] = [tour];
		}, this);
		return this.sortTours(tempTours);
	}

	/**
	 * Sorts tour object by date in ascending order.
	 * @param {Object} theTours  - JSON containing campus tours with keys being calendar dates MM/DD/YYYY
	 * @returns Ordered object by key in ascending order.
	 */
	sortTours(theTours){
		let sortedTours = {};
		Object.keys(theTours)
					.sort()
					.forEach((key) => {sortedTours[key] = theTours[key];});		
		return sortedTours;
	}

	/**
	 * Getter to get an object of all tours
	 * @returns allTours, an object with keys being dates, containing an array of tour objects.
	 */
	getAllTours(){
		return this.allTours;
	}
	
	/**
	 * Getter to get an object of tours after any filtering mutuations.
	 * @returns toursList, an object with keys being dates, containing an array of tour objects.
	 */
	getTours(){
		return this.toursList;
	}

	/**
	 * Removes all tours from tourList which do not occure within the month provided by the parameter mm.
	 * @param {String} mm - a two character string representing the month e.g. August would be 08 
	 */
	toursByMonth(mm){
		let tempTours = {};
		Object.keys(this.toursList)
					.forEach((key) => {
						if(key.substr(0, 2) === mm){
							tempTours[key] = this.toursList[key];
						}
					});
		this.toursList = tempTours;
	}

	/**
	 * Removes all tours from tourList which do not occure on the day provided by the parameter dd.
	 * @param {String} dd - a two character string representing the day, for single digit days, add a preceeding zero.
	 */	
	toursByDay(dd){
		let tempTours = {};
		Object.keys(this.toursList)
					.forEach((key) => {
						if(key.substr(3, 2) === dd){
							tempTours[key] = this.toursList[key];
						}
					});
					
		this.toursList = tempTours;
	}
	
	/**
	 * Removes all tours from tourList which do not occure in the year provided by the parameter yr.
	 * @param {String} yr - a four character string representing the year.
	 */	
	toursByYear(yr){
		let tempTours = {};
		Object.keys(this.toursList)
					.forEach((key) => {
						if(key.substr(6, 4) === yr){
							tempTours[key] = this.toursList[key];
						}
					});
					
		this.toursList = tempTours;
	}
	
	/**
	 * Removes all tours from tourList which do not contain a "Y" value for the SPOTLIGHTTour key.
	 */	
	spotlightTours(){
		let tempTours = {};
		Object.keys(this.toursList).forEach((key) => {
			this.toursList[key].map(tour => {
				if(tour.SPOTLIGHTTour === "Y"){
					tempTours[key] ? tempTours[key].push(tour) : tempTours[key] = [tour];
				}
			});
		});
		
		this.toursList = tempTours;
	}

	/**
	 * Removes all tours from tourList which do not have a value for Category matching the provided parameter category.
	 * @param {String} category - some tours are identified by category.
	 */	
	toursByCategory(category){
		let tempTours = {};
		Object.keys(this.toursList).forEach((key) => {
			this.toursList[key].map(tour => {
				if(tour.Category === category){
					tempTours[key] ? tempTours[key].push(tour) : tempTours[key] = [tour];
				}
			});
		});
		
		this.toursList = tempTours;
	}
}

exports.handler = async (event, context) => {
	try{
		const data = (await (S3.getObject(params).promise())).Body.toString('utf-8');
		let slateTours = new Tours(JSON.parse(data.replace(/\\n/g, '')));

		if(event.month){
			slateTours.toursByMonth(event.month);
		}	
		if(event.day){
			slateTours.toursByDay(event.day);
		}
		if(event.year){
			slateTours.toursByYear(event.year);
		}
		if(event.spotlight){
			slateTours.spotlightTours();
		}
		if(event.category){
			slateTours.toursByCategory(event.category);
		}
			
		let finalTours = slateTours.getTours();

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
			body: finalTours
		};
	} 
	catch(err){
		console.log(err);
		const message = `Error getting object ${params.Key} from bucket ${params.Bucket}. Make sure they exist and your bucket is in the same region as this function.`;
		console.log(message);
		throw new Error(message);
	}
};
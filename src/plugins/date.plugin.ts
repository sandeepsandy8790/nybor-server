import * as moment from 'moment-timezone';


export class  DateHelper
{

    /**
     * MongoDB stores date as date-time string
     * This makes Select() queries very tough
     * as time component might be a mismatch.
     * To avoid this when we are reading and
     * writing to Mongo where only DATE is required
     * We will simply strip the time component
     */
    public static NormalizeDate(d, timezone = "America/New_York")
    {
        var now = moment(d);
        var another = now.clone();
        return another.tz(timezone, true).startOf("day").format("YYYY-MM-DD"); 
    }


    /**
     * Calculates a range of dates
     * @param startDate First date in Range
     * @param isWeekly Should we need
     */
    public static GetRangeOfDatesInAMonth(startDate , isWeekly=false)
    {
            let endDate = moment(startDate).endOf("month");
            let offset = isWeekly ? 7 : 1;
            let dateRangeArray =  new Array();
            let diff = moment.duration(endDate.diff(startDate));
            let i=0;
            while(i < diff.asDays())
            {
                i = i+offset;
                if(i<diff.asDays())
                {
                    let newDate = moment(startDate).add(i,"d")
                    dateRangeArray.push(DateHelper.NormalizeDate(newDate));
                }
            }
            return dateRangeArray;
    }

    


   

}
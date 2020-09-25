const fetch = require('node-fetch');
const dayjs = require('dayjs');

const env = {
  apiUrl: 'https://gist.githubusercontent.com/nahuelb/0af04ce9aadab10afe2f37ba566070c2/raw/146a78550ae8acfe8724c8b49ff7b0716ae7ea92/gistfile1.txt',
};
/**
 * Fetch remote data
 */
const getSessionHistory = async () => {
  const response = await fetch(env.apiUrl);
  const data = await response.json();
  return data;
};

const sortByDate = (firstSession, secondSession) => dayjs(firstSession.dateSession).isBefore(secondSession.dateSession) ? 1 : -1;
const getPreviousDay  = (todaysSession) => todaysSession.clone().subtract(1, 'days').startOf('day');
const getDiffOnDays = (firstDate, secondDate) => dayjs(firstDate).endOf('day').diff(dayjs(secondDate).startOf('day'), 'days');

/**
 * Receives and array of sessions already sorted and return the next index of the array that accomplishes the rule of 
 * all sessions between the index 0 and the result, are continues dates.
 * If there is no more periods to get (because maybe there is no more data) returns -1
 * @param {*} sessionHistoryBlock 
 */
const getLastCompletionIndex = (sessionHistoryBlock) => {
  const lastCompletedSessionIndex = sessionHistoryBlock.findIndex((sessionHistory, index) => {
    if (index < sessionHistoryBlock.length - 1) {
      const firstDate = sessionHistory.dateSession;
      const secondDate = sessionHistoryBlock[index + 1].dateSession;
      const diffDays = getDiffOnDays(firstDate, secondDate);
      return diffDays > 1;
    } 
    return false;
  });
  return lastCompletedSessionIndex;
};

/**
 * This function calculates all the continue periods than a user took a session.
 * Returns an array, sorted by most recent, of all active amount of days on each continue period.
 * If amountOfPeriods parameter is sent, it will return until this value indicates. i.e if amountOfPeriods === 1, it will
 * return only the most recent active period
 * 
 * @param {*} sessionHistory 
 * @param {*} amountOfPeriods 
 */
const splitStreakPeriods = (sessionHistory, amountOfPeriods = null) => {
  // Filter only completed sessions and sort them by recent ones first
  const sortedCompletedSessions = sessionHistory.filter(session => session.isSessionCompleted).sort(sortByDate);
  let leftIndex = 0;
  const perdiodsOfStreak = [];
  while (true) {
    // Get the index in the session history array of the older continues day the user took a session
    const nextStreakIndex = getLastCompletionIndex(sortedCompletedSessions.slice(leftIndex)) + leftIndex;
    // Last day of current period
    const dayOfLastSessionInPeriod = sortedCompletedSessions[leftIndex].dateSession;
    // First day of current period
    const dayOfFirstSessionInPeriod = sortedCompletedSessions[nextStreakIndex].dateSession;
    const diffOnDaysInPeriod = getDiffOnDays(dayOfLastSessionInPeriod, dayOfFirstSessionInPeriod);
    // Adding 1 because we need to consider the limit day, rather than the difference between both dates
    perdiodsOfStreak.push(diffOnDaysInPeriod + 1);
    // Check if we should continue getting more periods
    if (amountOfPeriods && perdiodsOfStreak.length === amountOfPeriods) break;
    // If leftIndex > nextStreakIndex it means getLastCompletionIndex returned -1, there is no next index of continue active days
    if (leftIndex > nextStreakIndex) break;
    // Set the start index of next period
    leftIndex = nextStreakIndex + 1;
  }
 return perdiodsOfStreak;
}


const main = async () => {
  const sessionHistory = await getSessionHistory();
  // In order the get only the most recent period and avoid to calculate to the past, add the parameter amountOfPeriods = 1 to splitStreakPeriods call
  const splittedStreakPeriods = splitStreakPeriods(sessionHistory);
  console.log(`Most recent streak: ${splittedStreakPeriods[0]} days`);
  console.log(`Higher streak: ${Math.max(...splittedStreakPeriods)} days`);
};

main();

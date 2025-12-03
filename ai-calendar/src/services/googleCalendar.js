
const CLIENT_ID = '158408962262-6lefg23togdf629sh6u90bshap1b20tn.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient;
let gapiInited = false;
let gisInited = false;

const mapRecurrenceToRrule = (eventData) => {
    if (!eventData.recurrence || eventData.recurrence === 'none') return undefined;

    const rules = [];
    switch (eventData.recurrence) {
        case 'daily':
            rules.push('RRULE:FREQ=DAILY');
            break;
        case 'weekly':
            rules.push('RRULE:FREQ=WEEKLY');
            break;
        case 'monthly':
            rules.push('RRULE:FREQ=MONTHLY');
            break;
        case 'weekday':
            rules.push('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
            break;
        case 'weekend':
            rules.push('RRULE:FREQ=WEEKLY;BYDAY=SA,SU');
            break;
        case 'custom':
            if (eventData.recurrenceDays && eventData.recurrenceDays.length > 0) {
                const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
                const byDay = eventData.recurrenceDays.map(d => days[d]).join(',');
                rules.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
            }
            break;
    }
    return rules.length > 0 ? rules : undefined;
};

export const googleCalendarService = {
    isConfigured: () => !!CLIENT_ID,

    initialize: (callback) => {
        const checkGapi = setInterval(() => {
            if (typeof window.gapi !== 'undefined') {
                clearInterval(checkGapi);
                window.gapi.load('client', async () => {
                    await window.gapi.client.init({
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    gapiInited = true;
                    if (gisInited && callback) callback(true);
                });
            }
        }, 100);

        const checkGis = setInterval(() => {
            if (typeof window.google !== 'undefined' && window.google.accounts) {
                clearInterval(checkGis);
                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: '', // defined at request time
                });
                gisInited = true;
                if (gapiInited && callback) callback(true);
            }
        }, 100);
    },

    login: () => {
        return new Promise((resolve, reject) => {
            if (!tokenClient) return reject('Google API not initialized');

            tokenClient.callback = async (resp) => {
                if (resp.error) {
                    reject(resp);
                }
                resolve(resp);
            };

            if (window.gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    },

    logout: () => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token);
            window.gapi.client.setToken('');
        }
    },

    isAuthenticated: () => {
        return window.gapi && window.gapi.client && window.gapi.client.getToken() !== null;
    },

    listEvents: async (timeMin, timeMax) => {
        try {
            const request = {
                'calendarId': 'primary',
                'timeMin': timeMin.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime',
            };
            if (timeMax) {
                request.timeMax = timeMax.toISOString();
            }

            const response = await window.gapi.client.calendar.events.list(request);
            return response.result.items.map(item => {
                const isAllDay = item.start.date;
                return {
                    id: item.id,
                    title: item.summary,
                    start: item.start.dateTime || item.start.date,
                    end: isAllDay ? null : (item.end.dateTime || item.end.date),
                    location: item.location,
                    description: item.description,
                    attendees: item.attendees,
                    conferenceData: item.conferenceData,
                    colorId: item.colorId,
                    isGoogleEvent: true,
                    htmlLink: item.htmlLink,
                    recurringEventId: item.recurringEventId,
                    recurrence: item.recurringEventId ? 'recurring' : undefined
                };
            });
        } catch (err) {
            console.error('Error listing events', err);
            throw err;
        }
    },

    createEvent: async (eventData) => {
        try {
            const event = {
                'summary': eventData.title,
                'location': eventData.location,
                'description': eventData.description,
                'colorId': eventData.colorId,
                'start': {
                    'dateTime': eventData.start,
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': eventData.end || new Date(new Date(eventData.start).getTime() + 3600000).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'recurrence': mapRecurrenceToRrule(eventData),
                'attendees': eventData.attendees,
                'conferenceData': eventData.conferenceData ? {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                } : undefined
            };

            const requestOptions = {
                'calendarId': 'primary',
                'resource': event,
            };

            if (eventData.conferenceData) {
                requestOptions.conferenceDataVersion = 1;
            }

            const response = await window.gapi.client.calendar.events.insert(requestOptions);
            const item = response.result;
            const isAllDay = item.start.date;
            return {
                id: item.id,
                title: item.summary,
                start: item.start.dateTime || item.start.date,
                end: isAllDay ? null : (item.end.dateTime || item.end.date),
                location: item.location,
                description: item.description,
                attendees: item.attendees,
                conferenceData: item.conferenceData,
                colorId: item.colorId,
                isGoogleEvent: true,
                htmlLink: item.htmlLink
            };
        } catch (err) {
            console.error('Error creating event', err);
            throw err;
        }
    },

    updateEvent: async (eventId, eventData) => {
        try {
            const event = {
                'summary': eventData.title,
                'location': eventData.location,
                'description': eventData.description,
                'colorId': eventData.colorId,
                'start': {
                    'dateTime': eventData.start,
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': eventData.end || new Date(new Date(eventData.start).getTime() + 3600000).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'recurrence': mapRecurrenceToRrule(eventData),
                'attendees': eventData.attendees,
            };

            const response = await window.gapi.client.calendar.events.patch({
                'calendarId': 'primary',
                'eventId': eventId,
                'resource': event
            });
            const item = response.result;
            const isAllDay = item.start.date;
            return {
                id: item.id,
                title: item.summary,
                start: item.start.dateTime || item.start.date,
                end: isAllDay ? null : (item.end.dateTime || item.end.date),
                location: item.location,
                description: item.description,
                attendees: item.attendees,
                conferenceData: item.conferenceData,
                colorId: item.colorId,
                isGoogleEvent: true,
                htmlLink: item.htmlLink
            };
        } catch (err) {
            console.error('Error updating event', err);
            throw err;
        }
    },

    deleteEvent: async (eventId) => {
        try {
            await window.gapi.client.calendar.events.delete({
                'calendarId': 'primary',
                'eventId': eventId
            });
            return true;
        } catch (err) {
            console.error('Error deleting event', err);
            throw err;
        }
    },

    deleteFollowingEvents: async (recurringEventId, instanceStart) => {
        try {
            // 1. Get the master event
            const masterEvent = await window.gapi.client.calendar.events.get({
                'calendarId': 'primary',
                'eventId': recurringEventId
            });

            const masterResource = masterEvent.result;
            const recurrence = masterResource.recurrence;

            if (!recurrence || recurrence.length === 0) return;

            // 2. Calculate UNTIL (UTC)
            // We want to stop the series BEFORE the current instance.
            // So UNTIL should be (Instance Start Time - 1 second)
            const untilDate = new Date(instanceStart);
            untilDate.setSeconds(untilDate.getSeconds() - 1);

            const toGoogleISO = (date) => {
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            const untilStr = toGoogleISO(untilDate);

            // 3. Update RRULE
            const newRecurrence = recurrence.map(rule => {
                if (rule.startsWith('RRULE:')) {
                    let newRule = rule;
                    // Remove existing UNTIL and COUNT
                    newRule = newRule.replace(/;?UNTIL=[^;]+/, '');
                    newRule = newRule.replace(/;?COUNT=[^;]+/, '');

                    return `${newRule};UNTIL=${untilStr}`;
                }
                return rule;
            });

            // 4. Patch the master event
            await window.gapi.client.calendar.events.patch({
                'calendarId': 'primary',
                'eventId': recurringEventId,
                'resource': {
                    'recurrence': newRecurrence
                }
            });

            return true;
        } catch (err) {
            console.error('Error deleting following events', err);
            throw err;
        }
    }
};

const Agenda = require('agenda')

const db = {
    address: 'mongodb+srv://vijju:vijju@cluster0-ex1xq.mongodb.net/policy?retryWrites=true&w=majority&ssl=true',
    collection: 'agendaJobs'
}

const agenda = new Agenda({
    db: db,
    defaultLockLimit: 130
})

module.exports = agenda
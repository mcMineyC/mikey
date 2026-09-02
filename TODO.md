# Planning Center Integration
- [x] Authentication
- [x] Fetch immediate next plan
- [x] Fetch n most recent plans
- [x] Fetch plan given id (db or Planning Center)
- [x] Fetch assigned people
    - [x] Assigned role(s)
- [x] Fetch people profiles
- [x] Profile pic cache system
- [ ] Fetch n most recent plans and m in the future
- [ ] Periodic refresh

# DB
- [x] Schema
- [x] Module
- [x] Import PC data
- [x] Basic query
- [x] Get plan given id (db or Planning Center)
- [ ] Get next plan (based on time)
- [ ] Rotate stored plans based on age
- [ ] Mic assignment field
    - [ ] Add to schema
    - [ ] Return in queries
    - [ ] Update using plan id and person id
- [ ] Layout editor

# Backend Interaction
- [ ] Basic HTTP API
    - [ ] GET / - "go to \<a href="/clientview">client view\<a>"
    - [ ] GET /clientview -> serves web build directory
    - [ ] GET /plans - [{}] returning plan ids, name, and start time
    - [ ] GET /plan/:id - {} detailed info about plan (aka full query)
    - [ ] GET /plan/next - {} full query, returns ongoing plan (if in duration) or upcoming plan (if within same day)
    - [ ] GET /plan/:id/mics - [{}] return list of people (PCID, name, assignment string)
    - [ ] POST /plan/:id/mics/update - [{person, plan, string}] -> updated (/plan/:id/mics) update mic info for given plan using array of updates
    - [ ] GET /persons - [{PCID, name, image}] list known people
    - [ ] GET /person/:pcid - {PCID, name, image} get detailed info about person
    - [ ] GET /person/:pcid/image - return image of person
    - [ ] POST /person/:pcid/image - delete from cache and redownload (synchronous)
    - [ ] GET /clients - [{}] list clients
    - [ ] POST /client/new - {id, name, connection} -> {success, id}
    - [ ] GET /client/:id - {name, id, settings, location, online, connection} return client info
    - [ ] POST /client/:id - {} -> {success} update client info
    - [ ] GET /settings - {} return configuration, incl global client defaults, server settings, planning center details, etc
    - [ ] POST /settings - {} update configuration with changes in object (sparse)
- [ ] mDNS discovery
    - [ ] Set up from client
        - [ ] Client discover server
        - [ ] Register new client
        - [ ] Fetch config
    - [ ] Set up from manager
        - [ ] Server discovery
        - [ ] Connect to client
        - [ ] Register client
        - [ ] Send over config
    - [ ] Manager discover server
- [ ] WS Real-time updates
    - [ ] Initiation protocol
        - [ ] Server -> client
    - [ ] Notification hub
    - [ ] Data updates
        - [ ] Mic batteries
        - [ ] Notification
    - [ ] Client show plan
    - [ ] Layout editor updates

# Shure Control
- [ ] Mock device
- [ ] Module (funcs to send cmds)
- [ ] Async api framework
    - [ ] Request lookup table
    - [ ] Promise api
- [ ] Live-ish notifier for state updates

# Yamaha QL-5
- [ ] Module
- [ ] Async api framework
- [ ] List channel names
- [ ] set channel names
- [ ] set channel light colors

# Client
- [ ] View prototyping
- [ ] Wire data
    - [ ] PC data
    - [ ] Shure data
- [ ] Notification system
- [ ] Multiple plans
- [ ] Show chosen plan
- [ ] Stage layout view
- [ ] Client-driven initiation
- [ ] Web deployment
- [ ] Build native apps via GH Actions
- [ ] RPi build

# Manager
- [ ] Basic server discovery
- [ ] Settings
    - [ ] Client initiation
    - [ ] PC Authentication
    - [ ] Connections configuration (shure, yamaha, etc)
    - [ ] Extensive settings
- [ ] Simple plan editing (mic assignments)
- [ ] Layout manager prototyping

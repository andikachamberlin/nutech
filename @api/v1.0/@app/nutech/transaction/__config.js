const config = {
    database : "app_tryout_sub_category",
    query_export : "status, name, mode",
    query_search : "name LIKE ? OR bamboo LIKE ? LIMIT 4",
    query_name : "status, name, mode",
    query_secure : "?, ?, ?",
    query_update : "status= ?, name= ?, mode=?"
}

module.exports = {
    config
}
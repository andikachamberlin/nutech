/*------------------------------------------------------------------
[Node Module]
-------------------------------------------------------------------*/
const fs = require('fs');
const fse = require('fs-extra')
const express = require('express');
const router = express.Router();
const url = require('url');
const Entities = require('html-entities').AllHtmlEntities;
const sha1 = require('sha1');
const jwt = require('jsonwebtoken');
const axios = require('axios')
/*------------------------------------------------------------------
[Node Module]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Use Module]
-------------------------------------------------------------------*/
const entities = new Entities();
/*------------------------------------------------------------------
[End Use Module]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Require]
-------------------------------------------------------------------*/
const { dbc } = require('../../../../../../config/dbc');
const { verify_token, random_character, random_character_uppercase, convertDateFilter, convertDateFilterLocal, filter_char_50 } = require('../../../../../../config/functions');
const { updateClock } = require('../../../../../../config/updateClock');
const { api_sct } = require('../../../../../../config/token');
const dynamicDateTime = require("../../../../../../config/dateNow");
const { database, route } = require('../../../api.json');
const { config } = require('./__config.js');
/*------------------------------------------------------------------
[End Require]
-------------------------------------------------------------------*/

router.post('/', verify_token, (request, response) => {

    let routes = url.parse(request.url, true);

    let key = entities.encode(request.body.key);
    let sct = entities.encode(request.body.sct);

    if (key && sct) {

        jwt.verify(request.token, key, (error, verify) => {

            if (error) {

                response.json({
                    error: 'Token Denied'
                })

            } else {

                if (verify) {

                    let level = verify.auth[0].level;
                    let sub_level = verify.auth[0].sub_level;
                    let access = verify.auth[0].access;

                    console.log('----------------------------------------------------------');
                    console.log('@verify');
                    console.log('----------------------------------------------------------');
                    console.log(level + ' | ' + sub_level + ' | ' + access)
                    console.log('----------------------------------------------------------');
                    console.log('@base_url');
                    console.log('----------------------------------------------------------');
                    console.log(request.baseUrl)
                    console.log('----------------------------------------------------------');
                    console.log('@request');
                    console.log('----------------------------------------------------------');

                    if (api_sct === sct) {

                        if (routes.pathname == "/" && request.method === "POST") {

                            let bamboo_generate = random_character(16)
                            let params = config.database;

                            let bamboo_user = entities.encode(request.body.bamboo_user); console.log('bamboo_user : ', bamboo_user); if (!bamboo_user) { return response.json({ error: 'empty bamboo_user' }) }
                            let action = entities.encode(request.body.action); console.log('action : ', action); if (!action) { return response.json({ error: 'empty action' }) }

                            let today = dynamicDateTime.todayNow
                            let month = dynamicDateTime.monthNow
                            let year = dynamicDateTime.yearNow

                            let clock = dynamicDateTime.hourNow + ':' + dynamicDateTime.minuteNow

                            let date = dynamicDateTime.dateNow
                            let date_filter = convertDateFilter(dynamicDateTime.dateFilter)
                            let date_filter_local = convertDateFilterLocal(dynamicDateTime.dateFilter)

                            let clock_sync;
                            updateClock((e) => {
                                clock_sync = e.clockNow
                            })

                            if (level === 'admin') {

                                if (action === `insert_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let status = entities.encode(request.body.status); console.log('status : ', status); if (!status) { return response.json({ error: 'empty status' }) }
                                        let name = entities.encode(request.body.name); console.log('name : ', name); if (!name) { return response.json({ error: 'empty name' }) }
                                        let mode = entities.encode(request.body.mode); console.log('mode : ', mode); if (!mode) { return response.json({ error: 'empty mode' }) }

                                        dbc.query(`INSERT INTO ${database}_${params} (date_at, time_at, bamboo, bamboo_user, ${config.query_name}) VALUES (?, ?, ?, ?, ${config.query_secure})`, [date_filter_local, clock_sync, random_character(16), bamboo_user, status, name, mode], (error, results) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                response.json({
                                                    result: 'success',
                                                    title: 'Successfully',
                                                    data: null
                                                })

                                            }

                                        });

                                    }

                                } else if (action === `update_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let bamboo_update = entities.encode(request.body.bamboo_update); console.log('bamboo_update : ', bamboo_update); if (!bamboo_update) { return response.json({ error: 'empty bamboo_update' }) }

                                        let status = entities.encode(request.body.status); console.log('status : ', status); if (!status) { return response.json({ error: 'empty status' }) }
                                        let name = entities.encode(request.body.name); console.log('name : ', name); if (!name) { return response.json({ error: 'empty name' }) }
                                        let mode = entities.encode(request.body.mode); console.log('mode : ', mode); if (!mode) { return response.json({ error: 'empty mode' }) }

                                        dbc.query(`UPDATE ${database}_${params} SET ${config.query_update} WHERE bamboo= ?`, [status, name, mode, bamboo_update], (error, results) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                response.json({
                                                    result: 'success',
                                                    title: 'Successfully',
                                                    data: null
                                                })

                                            }

                                        });

                                    }

                                } else if (action === `delete_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let bamboo_delete = entities.encode(request.body.bamboo_delete); console.log('bamboo_delete : ', bamboo_delete); if (!bamboo_delete) { return response.json({ error: 'empty bamboo_delete' }) }

                                        dbc.query(`SELECT * FROM ${database}_${params} WHERE bamboo= ?`, [bamboo_delete], (error, data_json) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                if (data_json.length === 0) {
                                                    return response.json({
                                                        error: 'Data Not Found'
                                                    })
                                                }

                                                dbc.query(`SELECT name, username FROM ${database}_user WHERE bamboo= ?`, [data_json[0].bamboo_user], (error, user) => {

                                                    if (error) {
                                                        console.log(error)
                                                        response.json({
                                                            error: 'Request Error'
                                                        })

                                                    } else {

                                                        let name;
                                                        let username;

                                                        if (user.length === 0) {
                                                            name = 'Account Deleted'
                                                            username = '-'
                                                        } else {
                                                            name = user[0].name
                                                            username = user[0].username
                                                        }

                                                        dbc.query(`INSERT INTO ${database}_history_delete (date_at, time_at, bamboo, bamboo_user, name, username, from_table, from_detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user, name, username, params, JSON.stringify(data_json)], (error, results) => {

                                                            if (error) {
                                                                console.log(error)
                                                                response.json({
                                                                    error: 'Request Error'
                                                                })

                                                            } else {

                                                                dbc.query(`DELETE FROM ${database}_${params} WHERE bamboo= ?`, [bamboo_delete], (error, results) => {

                                                                    if (error) {
                                                                        console.log(error)
                                                                        response.json({
                                                                            error: 'Request Error'
                                                                        })

                                                                    } else {

                                                                        response.json({
                                                                            result: 'success',
                                                                            title: 'Successfully',
                                                                            data: null
                                                                        })

                                                                    }

                                                                });

                                                            }

                                                        });

                                                    }

                                                })

                                            }
                                        })

                                    }

                                } else if (action === `action_table_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let bamboo = entities.encode(request.body.bamboo); console.log('bamboo : ', bamboo); if (!bamboo) { return response.json({ error: 'empty bamboo' }) }
                                        let action_table_status = entities.encode(request.body.action_table_status); console.log('action_table_status : ', action_table_status); if (!action_table_status) { return response.json({ error: 'empty action_table_status' }) }
                                        // let action_table_message = entities.encode(request.body.action_table_message); console.log('action_table_message : ', action_table_message); if (!action_table_message) { return response.json({ error: 'empty action_table_message' }) }

                                        dbc.query(`UPDATE ${database}_${params} SET status= ? WHERE bamboo= ?`, [action_table_status, bamboo], (error, results) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                response.json({
                                                    result: 'success',
                                                    title: 'Successfully',
                                                    data: null
                                                })

                                            }

                                        });

                                    }

                                } else if (action === 'import_excel') {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let name = entities.encode(request.body.name); console.log('name : ', name); if (!name) { return response.json({ error: 'empty name' }) }

                                        dbc.query(`INSERT INTO ${database}_${params} (date_at, time_at, bamboo, bamboo_user) VALUES (?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user], (error, results) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                response.json({
                                                    result: 'success',
                                                    title: 'Successfully',
                                                    data: null
                                                })

                                            }

                                        });

                                    }

                                } else {

                                    response.json({
                                        error: 'Action Denied'
                                    })

                                }

                            } else if (level === 'user') {

                                if (action === `point_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let status = entities.encode(request.body.status); console.log('status : ', status); if (!status) { return response.json({ error: 'empty status' }) }
                                        let category_bamboo = entities.encode(request.body.category_bamboo); console.log('category_bamboo : ', category_bamboo); if (!category_bamboo) { return response.json({ error: 'empty category_bamboo' }) }
                                        let category_name = entities.encode(request.body.category_name); console.log('category_name : ', category_name); if (!category_name) { return response.json({ error: 'empty category_name' }) }
                                        let sub_category_bamboo = entities.encode(request.body.sub_category_bamboo); console.log('sub_category_bamboo : ', sub_category_bamboo); if (!sub_category_bamboo) { return response.json({ error: 'empty sub_category_bamboo' }) }
                                        let sub_category_name = entities.encode(request.body.sub_category_name); console.log('sub_category_name : ', sub_category_name); if (!sub_category_name) { return response.json({ error: 'empty sub_category_name' }) }
                                        let point = entities.encode(request.body.point); console.log('point : ', point); if (!point) { return response.json({ error: 'empty point' }) }
                                        let array_answer = entities.encode(request.body.array_answer); console.log('array_answer : ', array_answer); if (!array_answer) { return response.json({ error: 'empty array_answer' }) }
                                        let janjang_bamboo = entities.encode(request.body.janjang_bamboo); console.log('janjang_bamboo : ', janjang_bamboo); if (!janjang_bamboo) { return response.json({ error: 'empty janjang_bamboo' }) }

                                        dbc.query(`INSERT INTO ${database}_app_tryout_point (date_at, time_at, bamboo, bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, point, array_answer, jenjang_bamboo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, point, array_answer, jenjang_bamboo], (error, results) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                dbc.query(`UPDATE ${database}_app_tryout_payment SET status_tryout= ? WHERE category_bamboo= ? AND sub_category_bamboo=? AND bamboo_user=?`, ['sync', category_bamboo, sub_category_bamboo, bamboo_user], (error, results) => {

                                                    if (error) {
                                                        console.log(error)
                                                        response.json({
                                                            error: 'Request Error'
                                                        })

                                                    } else {

                                                        response.json({
                                                            result: 'success',
                                                            title: 'Successfully',
                                                            data: null
                                                        })

                                                    }

                                                });

                                            }

                                        });

                                    }

                                } else if (action === `payment_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let status = entities.encode(request.body.status); console.log('status : ', status); if (!status) { return response.json({ error: 'empty status' }) }
                                        let category_bamboo = entities.encode(request.body.category_bamboo); console.log('category_bamboo : ', category_bamboo); if (!category_bamboo) { return response.json({ error: 'empty category_bamboo' }) }
                                        let category_name = entities.encode(filter_char_50(request.body.category_name)); console.log('category_name : ', category_name); if (!category_name) { return response.json({ error: 'empty category_name' }) }
                                        let sub_category_bamboo = entities.encode(request.body.sub_category_bamboo); console.log('sub_category_bamboo : ', sub_category_bamboo); if (!sub_category_bamboo) { return response.json({ error: 'empty sub_category_bamboo' }) }
                                        let sub_category_name = entities.encode(request.body.sub_category_name); console.log('sub_category_name : ', sub_category_name); if (!sub_category_name) { return response.json({ error: 'empty sub_category_name' }) }
                                        let price = entities.encode(request.body.price); console.log('price : ', price); if (!price) { return response.json({ error: 'empty price' }) }
                                        let price_bundle = entities.encode(request.body.price_bundle); console.log('price_bundle : ', price_bundle); if (!price_bundle) { return response.json({ error: 'empty price_bundle' }) }
                                        let price_promo = entities.encode(request.body.price_promo); console.log('price_promo : ', price_promo); if (!price_promo) { return response.json({ error: 'empty price_promo' }) }
                                        let mode = entities.encode(request.body.mode); console.log('mode : ', mode); if (!mode) { return response.json({ error: 'empty mode' }) }

                                        if (price === '0') { return response.json({ error: 'Maaf Kami Tidak mengizinkan Koleksi Dengan Harga Rp. 0' }) }

                                        dbc.query(`SELECT name, email, no_hp FROM ${database}_user WHERE bamboo=?`, [bamboo_user], (error, user_data) => {

                                            if (error) {

                                                console.log(error)
                                                return response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                if (user_data.length === 0) {

                                                    response.json({
                                                        error: 'User Not Found'
                                                    })

                                                } else {

                                                    if (mode === 'claim') {

                                                        let claim_bamboo = entities.encode(request.body.claim_bamboo); console.log('claim_bamboo : ', claim_bamboo); if (!claim_bamboo) { return response.json({ error: 'empty claim_bamboo' }) }
                                                        let claim_name = entities.encode(request.body.claim_name); console.log('claim_name : ', claim_name); if (!claim_name) { return response.json({ error: 'empty claim_name' }) }

                                                        dbc.query(`SELECT * FROM ${database}_app_tryout_payment WHERE category_bamboo= ? AND sub_category_bamboo= ? AND claim_bamboo= ? AND bamboo_user=? AND payment_status=?`, [category_bamboo, sub_category_bamboo, claim_bamboo, bamboo_user, 'finish'], (error, check_payment) => {

                                                            if (error) {
                                                                console.log(error)
                                                                return response.json({
                                                                    error: 'Request Error'
                                                                })
                                                            } else {

                                                                if (check_payment.length !== 0) {
                                                                    return response.json({
                                                                        error: 'Sudah Dibeli'
                                                                    })
                                                                } else {

                                                                    let price_fix = 
                                                                        parseInt(price_promo) !== 0 ?
                                                                            parseInt(price_promo)
                                                                        : parseInt(price_bundle) !== 0 ?
                                                                            parseInt(price_bundle)
                                                                        :
                                                                            parseInt(price)

                                                                    console.log('price_fix', price_fix)

                                                                    let data = JSON.stringify({
                                                                        "transaction_details": {
                                                                            "order_id": bamboo_generate,
                                                                            "gross_amount": price_fix
                                                                        },
                                                                        "credit_card": {
                                                                            "secure": true
                                                                        },
                                                                        "item_details": [{
                                                                            "id": bamboo_generate,
                                                                            "price": price_fix,
                                                                            "quantity": 1,
                                                                            "name": category_name,
                                                                            "brand": process.env.ENV_BRAND,
                                                                            "category": sub_category_name,
                                                                            "merchant_name": process.env.ENV_BRAND
                                                                        }],
                                                                        "customer_details": {
                                                                            "first_name": user_data[0].name,
                                                                            "last_name": "",
                                                                            "email": user_data[0].email,
                                                                            "phone": user_data[0].no_hp
                                                                        },
                                                                        "callbacks": {
                                                                            "finish": process.env.ENV_PRODUCTION === 'false' ? process.env.ENV_MIDTRANS_SANDBOX_CALLBACK : process.env.ENV_MIDTRANS_PRODUCTION_CALLBACK
                                                                        }
                                                                    });

                                                                    let config = {
                                                                        method: 'post',
                                                                        maxBodyLength: Infinity,
                                                                        url: `${process.env.ENV_PRODUCTION === 'false' ? process.env.ENV_SANDBOX_MIDTRANS_URL : process.env.ENV_PRODUCTION_MIDTRANS_URL}/snap/v1/transactions`,
                                                                        headers: {
                                                                            'Accept': 'application/json',
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Basic ${process.env.ENV_PRODUCTION === 'false' ? process.env.ENV_SANDBOX_MIDTRANS_TOKEN : process.env.ENV_PRODUCTION_MIDTRANS_TOKEN}`
                                                                        },
                                                                        data: data
                                                                    };

                                                                    axios.request(config)
                                                                        .then((midtrans) => {
                                                                            // console.log(midtrans,data.token);

                                                                            // return response.json({
                                                                            //     error: 'Test Error'
                                                                            // })

                                                                            let data_console = {
                                                                                ...midtrans.data,
                                                                                ...{
                                                                                    order_id: bamboo_generate
                                                                                }
                                                                            }

                                                                            console.log('data_console', data_console)

                                                                            dbc.query(`INSERT INTO ${database}_app_tryout_payment (date_at, time_at, bamboo, bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, claim_bamboo, claim_name, price, price_bundle, price_promo, token, order_id, payment_url, payment_status, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, claim_bamboo, claim_name, price, price_bundle, price_promo, midtrans.data.token, bamboo_generate, midtrans.data.redirect_url, 'pending', mode], (error, results) => {

                                                                                if (error) {
                                                                                    console.log(error)
                                                                                    response.json({
                                                                                        error: 'Request Error'
                                                                                    })

                                                                                } else {

                                                                                    response.json({
                                                                                        result: 'success',
                                                                                        title: 'Successfully',
                                                                                        data: {
                                                                                            ...midtrans.data,
                                                                                            ...{
                                                                                                order_id: bamboo_generate
                                                                                            }
                                                                                        },
                                                                                        mode: process.env.ENV_PRODUCTION
                                                                                    })

                                                                                }

                                                                            });
                                                                        })
                                                                        .catch((error) => {
                                                                            console.log('error', error.message)
                                                                            response.json({
                                                                                error: error.message
                                                                            })
                                                                        });

                                                                }

                                                            }

                                                        })

                                                    } else {

                                                        dbc.query(`SELECT * FROM ${database}_app_tryout_payment WHERE category_bamboo= ? AND sub_category_bamboo= ? AND bamboo_user=? AND payment_status=?`, [category_bamboo, sub_category_bamboo, bamboo_user, 'finish'], (error, check_payment) => {

                                                            if (error) {
                                                                console.log(error)
                                                                return response.json({
                                                                    error: 'Request Error'
                                                                })
                                                            } else {

                                                                if (check_payment.length !== 0) {
                                                                    return response.json({
                                                                        error: 'Sudah Dibeli'
                                                                    })
                                                                } else {

                                                                    let price_fix = 
                                                                        parseInt(price_promo) !== 0 ?
                                                                            parseInt(price_promo)
                                                                        : parseInt(price_bundle) !== 0 ?
                                                                            parseInt(price_bundle)
                                                                        :
                                                                            parseInt(price)

                                                                    console.log('price_fix', price_fix)

                                                                    let data = JSON.stringify({
                                                                        "transaction_details": {
                                                                            "order_id": bamboo_generate,
                                                                            "gross_amount": price_fix
                                                                        },
                                                                        "credit_card": {
                                                                            "secure": true
                                                                        },
                                                                        "item_details": [{
                                                                            "id": bamboo_generate,
                                                                            "price": price_fix,
                                                                            "quantity": 1,
                                                                            "name": category_name,
                                                                            "brand": process.env.ENV_BRAND,
                                                                            "category": sub_category_name,
                                                                            "merchant_name": process.env.ENV_BRAND
                                                                        }],
                                                                        "customer_details": {
                                                                            "first_name": user_data[0].name,
                                                                            "last_name": "",
                                                                            "email": user_data[0].email,
                                                                            "phone": user_data[0].no_hp
                                                                        },
                                                                        "callbacks": {
                                                                            "finish": process.env.ENV_PRODUCTION === 'false' ? process.env.ENV_MIDTRANS_SANDBOX_CALLBACK : process.env.ENV_MIDTRANS_PRODUCTION_CALLBACK
                                                                        }
                                                                    });

                                                                    let config = {
                                                                        method: 'post',
                                                                        maxBodyLength: Infinity,
                                                                        url: `${process.env.ENV_PRODUCTION === 'false' ? process.env.ENV_SANDBOX_MIDTRANS_URL : process.env.ENV_PRODUCTION_MIDTRANS_URL}/snap/v1/transactions`,
                                                                        headers: {
                                                                            'Accept': 'application/json',
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Basic ${process.env.ENV_PRODUCTION === 'false' ? process.env.ENV_SANDBOX_MIDTRANS_TOKEN : process.env.ENV_PRODUCTION_MIDTRANS_TOKEN}`
                                                                        },
                                                                        data: data
                                                                    };

                                                                    axios.request(config)
                                                                        .then((midtrans) => {
                                                                            // console.log(midtrans,data.token);

                                                                            // return response.json({
                                                                            //     error: 'Test Error'
                                                                            // })

                                                                            let data_console = {
                                                                                ...midtrans.data,
                                                                                ...{
                                                                                    order_id: bamboo_generate
                                                                                }
                                                                            }

                                                                            console.log('data_console', data_console)

                                                                            dbc.query(`INSERT INTO ${database}_app_tryout_payment (date_at, time_at, bamboo, bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, price, price_bundle, price_promo, token, order_id, payment_url, payment_status, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, price, price_bundle, price_promo, midtrans.data.token, bamboo_generate, midtrans.data.redirect_url, 'pending', mode], (error, results) => {

                                                                                if (error) {
                                                                                    console.log(error)
                                                                                    response.json({
                                                                                        error: 'Request Error'
                                                                                    })

                                                                                } else {

                                                                                    response.json({
                                                                                        result: 'success',
                                                                                        title: 'Successfully',
                                                                                        data: {
                                                                                            ...midtrans.data,
                                                                                            ...{
                                                                                                order_id: bamboo_generate
                                                                                            }
                                                                                        },
                                                                                        mode: process.env.ENV_PRODUCTION
                                                                                    })

                                                                                }

                                                                            });
                                                                        })
                                                                        .catch((error) => {
                                                                            console.log('error', error.message)
                                                                            response.json({
                                                                                error: error.message
                                                                            })
                                                                        });

                                                                }

                                                            }

                                                        })

                                                    }

                                                }

                                            }

                                        });

                                    }

                                } else if (action === `claim_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let status = entities.encode(request.body.status); console.log('status : ', status); if (!status) { return response.json({ error: 'empty status' }) }
                                        let category_bamboo = entities.encode(request.body.category_bamboo); console.log('category_bamboo : ', category_bamboo); if (!category_bamboo) { return response.json({ error: 'empty category_bamboo' }) }
                                        let category_name = entities.encode(request.body.category_name); console.log('category_name : ', category_name); if (!category_name) { return response.json({ error: 'empty category_name' }) }
                                        let sub_category_bamboo = entities.encode(request.body.sub_category_bamboo); console.log('sub_category_bamboo : ', sub_category_bamboo); if (!sub_category_bamboo) { return response.json({ error: 'empty sub_category_bamboo' }) }
                                        let sub_category_name = entities.encode(request.body.sub_category_name); console.log('sub_category_name : ', sub_category_name); if (!sub_category_name) { return response.json({ error: 'empty sub_category_name' }) }
                                        let price = entities.encode(request.body.price); console.log('price : ', price); if (!price) { return response.json({ error: 'empty price' }) }
                                        let price_bundle = entities.encode(request.body.price_bundle); console.log('price_bundle : ', price_bundle); if (!price_bundle) { return response.json({ error: 'empty price_bundle' }) }
                                        let price_promo = entities.encode(request.body.price_promo); console.log('price_promo : ', price_promo); if (!price_promo) { return response.json({ error: 'empty price_promo' }) }

                                        dbc.query(`SELECT * FROM ${database}_app_tryout_payment WHERE category_bamboo= ? AND sub_category_bamboo= ? AND bamboo_user=? AND payment_status=?`, [category_bamboo, sub_category_bamboo, bamboo_user, 'finish'], (error, check_payment) => {

                                            console.log('check_payment', check_payment)

                                            if (error) {
                                                console.log(error)
                                                return response.json({
                                                    error: 'Request Error'
                                                })
                                            } else {

                                                if (check_payment.length !== 0) {
                                                    return response.json({
                                                        error: 'Sudah Dibeli'
                                                    })
                                                } else {

                                                    dbc.query(`INSERT INTO ${database}_app_tryout_payment (date_at, time_at, bamboo, bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, price, price_bundle, price_promo, token, order_id, payment_url, payment_status, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user, status, category_bamboo, category_name, sub_category_bamboo, sub_category_name, price, price_bundle, price_promo, '-', bamboo_generate, '-', 'finish', 'free'], (error, results) => {

                                                        if (error) {
                                                            console.log(error)
                                                            response.json({
                                                                error: 'Request Error'
                                                            })

                                                        } else {

                                                            response.json({
                                                                result: 'success',
                                                                title: 'Successfully',
                                                                data: null,
                                                                mode: 'free'
                                                            })

                                                        }

                                                    });

                                                }

                                            }

                                        })

                                    }

                                } else if (action === `feedback_${params}`) {

                                    if (access === 'coconut') {

                                        response.json({
                                            error: 'Null'
                                        })

                                    } else {

                                        let category_bamboo = entities.encode(request.body.category_bamboo); console.log('category_bamboo : ', category_bamboo); if (!category_bamboo) { return response.json({ error: 'empty category_bamboo' }) }
                                        let sub_category_bamboo = entities.encode(request.body.sub_category_bamboo); console.log('sub_category_bamboo : ', sub_category_bamboo); if (!sub_category_bamboo) { return response.json({ error: 'empty sub_category_bamboo' }) }
                                        let tryout = entities.encode(request.body.tryout); console.log('tryout : ', tryout); if (!tryout) { return response.json({ error: 'empty tryout' }) }
                                        let feedback = entities.encode(request.body.feedback); console.log('feedback : ', feedback); if (!feedback) { return response.json({ error: 'empty feedback' }) }
                                        let qa_text_1 = entities.encode(request.body.qa_text_1); console.log('qa_text_1 : ', qa_text_1); if (!qa_text_1) { return response.json({ error: 'empty qa_text_1' }) }
                                        let qa_text_2 = entities.encode(request.body.qa_text_2); console.log('qa_text_2 : ', qa_text_2); if (!qa_text_2) { return response.json({ error: 'empty qa_text_2' }) }
                                        let qa_text_3 = entities.encode(request.body.qa_text_3); console.log('qa_text_3 : ', qa_text_3); if (!qa_text_3) { return response.json({ error: 'empty qa_text_3' }) }
                                        let qa_rating_1 = entities.encode(request.body.qa_rating_1); console.log('qa_rating_1 : ', qa_rating_1); if (!qa_rating_1) { return response.json({ error: 'empty qa_rating_1' }) }
                                        let qa_rating_2 = entities.encode(request.body.qa_rating_2); console.log('qa_rating_2 : ', qa_rating_2); if (!qa_rating_2) { return response.json({ error: 'empty qa_rating_2' }) }
                                        let qa_rating_3 = entities.encode(request.body.qa_rating_3); console.log('qa_rating_3 : ', qa_rating_3); if (!qa_rating_3) { return response.json({ error: 'empty qa_rating_3' }) } 	

                                        dbc.query(`INSERT INTO ${database}_app_tryout_feedback (date_at, time_at, bamboo, bamboo_user, status, category_bamboo, sub_category_bamboo, tryout, feedback, qa_text_1, qa_text_2, qa_text_3, qa_rating_1, qa_rating_2, qa_rating_3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [date_filter_local, clock_sync, random_character(16), bamboo_user, 'active', category_bamboo, sub_category_bamboo, tryout, feedback, qa_text_1, qa_text_2, qa_text_3, qa_rating_1, qa_rating_2, qa_rating_3], (error, results) => {

                                            if (error) {
                                                console.log(error)
                                                response.json({
                                                    error: 'Request Error'
                                                })

                                            } else {

                                                response.json({
                                                    result: 'success',
                                                    title: 'Successfully',
                                                    data: null,
                                                    mode: 'free'
                                                })

                                            }

                                        });

                                    }

                                } else {

                                    response.json({
                                        error: 'Action Denied'
                                    })

                                }

                            } else {

                                response.json({
                                    error: 'Level Denied'
                                })

                            }

                        } else {

                            response.json({
                                error: 'Error Routes'
                            })

                        }

                    } else {

                        response.json({
                            error: 'SCT Denied'
                        })

                    }

                } else {

                    response.json({
                        error: 'Verify Denied'
                    })

                }


            }

        });

    } else {

        response.json({
            error: 'Authentication Denied'
        })

    }

});

module.exports = router;
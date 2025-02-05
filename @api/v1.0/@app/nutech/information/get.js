/*------------------------------------------------------------------
[Node Module]
-------------------------------------------------------------------*/
const fs = require('fs');
const fse = require('fs-extra')
const express = require('express');
const router = express.Router();
const url = require('url');
const path = require('path');
const Entities = require('html-entities').AllHtmlEntities;
const jwt = require('jsonwebtoken');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx')
const zipFolder = require('zip-a-folder');
const html_to_pdf = require('html-pdf-node');
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
const { dbc, runQuery } = require('../../../../../../config/dbc');
const { verify_token, random_character, capitalizeWords, getExtention } = require('../../../../../../config/functions');
const { exportPath } = require('../../../../../../config/exportPath');
const { api_sct } = require('../../../../../../config/token');
const { database, route } = require('../../../api.json');
const { config } = require('./__config.js');
/*------------------------------------------------------------------
[End Require]
-------------------------------------------------------------------*/

router.get('/', verify_token, (request, response) => {

    let q = url.parse(request.url, true);
    let routes = url.parse(request.url, true);

    let key = entities.encode(q.query.key);
    let sct = entities.encode(q.query.sct);

    if (key && sct) {

        jwt.verify(request.token, key, async (error, verify) => {

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

                        if (routes.pathname == "/" && request.method === "GET") {

                            let bamboo_generate = random_character(16)
                            let params = config.database;
                            let params_tanggal_filter = 'date_at';

                            let query_select = config.query_export

                            let bamboo_user = entities.encode(q.query.bamboo_user); console.log('bamboo_user : ', bamboo_user);
                            let bamboo_sub_category = entities.encode(q.query.bamboo_sub_category); console.log('bamboo_sub_category : ', bamboo_sub_category);
                            let action = entities.encode(q.query.action); console.log('action : ', action);
                            let limit = parseInt(entities.encode(q.query.limit)); console.log('limit : ', limit);
        if (limit <= 0) { return response.json({ error: 'Limit Denied'}) }
                            let offset = parseInt(entities.encode(q.query.offset)); console.log('offset : ', offset);
                            let pagination_active = parseInt(entities.encode(q.query.pagination_active)); console.log('pagination_active : ', pagination_active);
                            let search = entities.encode(q.query.search); console.log('search : ', search);

                            if (level === 'admin') {

                                if (action === `read_${params}`) {

                                    if (sub_level === 'mitra') {

                                        if (access === 'coconut') {

                                            response.json({
                                                error: 'Null'
                                            })

                                        } else {

                                            dbc.query(`SELECT COUNT(id) as length FROM ${database}_${params} WHERE bamboo_user='${bamboo_user}' AND mode='toefl'`, [], (error, count) => {

                                                if (error) {

                                                    response.json({
                                                        error: 'Count Error'
                                                    })

                                                } else {

                                                    let data_count = Math.ceil(count[0].length / limit);

                                                    // if (pagination_active > data_count) {
                                                    //     return response.json({
                                                    //         error: 'Page Denied'
                                                    //     })
                                                    // }

                                                    let count_array = [];

                                                    let i;
                                                    for (i = 0; i < data_count; i++) {
                                                        count_array.push(i + 1)
                                                    }

                                                    const pagination_calc = (array, page_size, page_number) => {
                                                        return array.slice(page_number * page_size, page_number * page_size + page_size);
                                                    };

                                                    let next = pagination_calc(count_array, 1, pagination_active)
                                                    let prev = pagination_calc(count_array, 1, pagination_active - 2)
                                                    let last = [data_count]
                                                    let active = [pagination_active]

                                                    if (count_array) {

                                                        dbc.query(`SELECT * FROM ${database}_${params} WHERE bamboo_user='${bamboo_user}' AND mode='toefl' ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset], (error, data) => {

                                                            if (error) {
                                                                console.log(error)
                                                                response.json({
                                                                    error: 'Limit Error'
                                                                })

                                                            } else {

                                                                response.json({
                                                                    result: 'success',
                                                                    title: 'Successfully',
                                                                    data: {
                                                                        count: count[0].length,
                                                                        next: next,
                                                                        prev: prev,
                                                                        last: last,
                                                                        pages: active,
                                                                        limit: limit,
                                                                        offset: offset,
                                                                        list: data
                                                                    }
                                                                })

                                                            }

                                                        });

                                                    }


                                                }


                                            });

                                        }

                                    } else {

                                        if (access === 'coconut') {

                                            response.json({
                                                error: 'Null'
                                            })

                                        } else {

                                            dbc.query(`SELECT COUNT(id) as length FROM ${database}_${params} WHERE mode='toefl'`, [], (error, count) => {

                                                if (error) {

                                                    response.json({
                                                        error: 'Count Error'
                                                    })

                                                } else {

                                                    let data_count = Math.ceil(count[0].length / limit);

                                                    // if (pagination_active > data_count) {
                                                    //     return response.json({
                                                    //         error: 'Page Denied'
                                                    //     })
                                                    // }

                                                    let count_array = [];

                                                    let i;
                                                    for (i = 0; i < data_count; i++) {
                                                        count_array.push(i + 1)
                                                    }

                                                    const pagination_calc = (array, page_size, page_number) => {
                                                        return array.slice(page_number * page_size, page_number * page_size + page_size);
                                                    };

                                                    let next = pagination_calc(count_array, 1, pagination_active)
                                                    let prev = pagination_calc(count_array, 1, pagination_active - 2)
                                                    let last = [data_count]
                                                    let active = [pagination_active]

                                                    if (count_array) {

                                                        dbc.query(`SELECT * FROM ${database}_${params} WHERE mode='toefl' ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset], (error, data) => {

                                                            if (error) {
                                                                console.log(error)
                                                                response.json({
                                                                    error: 'Limit Error'
                                                                })

                                                            } else {

                                                                response.json({
                                                                    result: 'success',
                                                                    title: 'Successfully',
                                                                    data: {
                                                                        count: count[0].length,
                                                                        next: next,
                                                                        prev: prev,
                                                                        last: last,
                                                                        pages: active,
                                                                        limit: limit,
                                                                        offset: offset,
                                                                        list: data
                                                                    }
                                                                })

                                                            }

                                                        });

                                                    }


                                                }


                                            });

                                        }

                                    }

                                } else if (action === `search_${params}`) {

                                    if (sub_level === 'mitra') {

                                        if (search) {

                                            let combine_search = "%" + search + "%";

                                            dbc.query(`SELECT * FROM ${database}_${params} WHERE bamboo_user='${bamboo_user}' AND mode='toefl' AND ${config.query_search}`, [combine_search, combine_search], (error, like) => {

                                                if (error) {
                                                    console.log(error)
                                                    response.json({
                                                        error: 'Search Error'
                                                    })

                                                } else {

                                                    if (like.length > 0) {

                                                        response.json({
                                                            result: 'success',
                                                            title: 'Successfully',
                                                            data: {
                                                                count: like.length,
                                                                next: [1],
                                                                prev: [1],
                                                                last: [1],
                                                                pages: [1],
                                                                list: like
                                                            }
                                                        })

                                                    } else {

                                                        response.json({
                                                            error: 'Search Not Found'
                                                        })

                                                    }

                                                }

                                            });

                                        } else {

                                            response.json({
                                                error: 'Keyword Not Found'
                                            })

                                        }

                                    } else {

                                        if (search) {

                                            let combine_search = "%" + search + "%";

                                            dbc.query(`SELECT * FROM ${database}_${params} WHERE mode='toefl' AND ${config.query_search}`, [combine_search, combine_search], (error, like) => {

                                                if (error) {
                                                    console.log(error)
                                                    response.json({
                                                        error: 'Search Error'
                                                    })

                                                } else {

                                                    if (like.length > 0) {

                                                        response.json({
                                                            result: 'success',
                                                            title: 'Successfully',
                                                            data: {
                                                                count: like.length,
                                                                next: [1],
                                                                prev: [1],
                                                                last: [1],
                                                                pages: [1],
                                                                list: like
                                                            }
                                                        })

                                                    } else {

                                                        response.json({
                                                            error: 'Search Not Found'
                                                        })

                                                    }

                                                }

                                            });

                                        } else {

                                            response.json({
                                                error: 'Keyword Not Found'
                                            })

                                        }

                                    }

                                } else if (action === `json_${params}`) {

                                    let date_from = entities.encode(q.query.date_from); console.log('date_from : ', date_from); if (!date_from) { return response.json({ error: 'empty date_from' }) }
                                    let date_to = entities.encode(q.query.date_to); console.log('date_to : ', date_to); if (!date_to) { return response.json({ error: 'empty date_to' }) }

                                    dbc.query(`SELECT ${query_select} FROM ${database}_${params} WHERE mode='toefl' AND (${params_tanggal_filter} BETWEEN '${date_from}' AND '${date_to}')`, [], (error, data) => {

                                        if (error) {

                                            response.json({
                                                error: 'Data Error'
                                            })

                                        } else {

                                            let dir = exportPath + '/' + bamboo_user;

                                            const _export = () => {

                                                fs.writeFile(dir + '/' + `${params}_export.json`, JSON.stringify(data), 'utf8', (jsonError, jsonData) => {
                                                    console.log('error : ', jsonError)
                                                    console.log('data  : ', jsonData)
                                                    if (jsonError) {
                                                        response.json({
                                                            error: 'Error Export'
                                                        })
                                                    } else {
                                                        response.json({
                                                            result: 'success',
                                                            title: 'Get Data',
                                                            data: bamboo_user + '/' + `${params}_export.json`
                                                        })
                                                    }
                                                });

                                            }

                                            if (!fs.existsSync(dir)) {
                                                Promise.all([
                                                    fs.mkdirSync(dir)
                                                ]).then(() => {
                                                    console.log("Directory created");
                                                    _export()
                                                })
                                            } else {
                                                console.log("Directory already exist");
                                                _export()
                                            }

                                        }


                                    });

                                } else if (action === `csv_${params}`) {

                                    let date_from = entities.encode(q.query.date_from); console.log('date_from : ', date_from); if (!date_from) { return response.json({ error: 'empty date_from' }) }
                                    let date_to = entities.encode(q.query.date_to); console.log('date_to : ', date_to); if (!date_to) { return response.json({ error: 'empty date_to' }) }

                                    dbc.query(`SELECT ${query_select} FROM ${database}_${params} WHERE mode='toefl' AND (${params_tanggal_filter} BETWEEN '${date_from}' AND '${date_to}')`, [], (error, data) => {

                                        if (error) {

                                            response.json({
                                                error: 'Data Error'
                                            })

                                        } else {

                                            if (!data.length > 0) return response.json({
                                                error: 'Not Found'
                                            })

                                            let data_header = [];
                                            let records = [];

                                            Object.keys(data[0]).map((key, index) => {
                                                data_header.push({
                                                    id: key,
                                                    title: capitalizeWords(key.replace(/_/g, " "))
                                                })
                                            })

                                            Object.keys(data)
                                                .forEach(function eachKey(key) {

                                                    records.push(
                                                        data[key]
                                                    )

                                                });

                                            let dir = exportPath + '/' + bamboo_user;

                                            const _export = () => {

                                                const csvWriter = createCsvWriter({
                                                    path: dir + '/' + `${params}_export.csv`,
                                                    header: data_header
                                                });

                                                csvWriter.writeRecords(records)       // returns a promise
                                                    .then(() => {
                                                        console.log('...Done');
                                                        response.json({
                                                            result: 'success',
                                                            title: 'Get Data',
                                                            data: bamboo_user + '/' + `${params}_export.csv`
                                                        })
                                                    });


                                            }

                                            if (!fs.existsSync(dir)) {
                                                Promise.all([
                                                    fs.mkdirSync(dir)
                                                ]).then(() => {
                                                    console.log("Directory created");
                                                    _export()
                                                })
                                            } else {
                                                console.log("Directory already exist");
                                                _export()
                                            }

                                        }


                                    });

                                } else if (action === `excel_${params}`) {

                                    let date_from = entities.encode(q.query.date_from); console.log('date_from : ', date_from); if (!date_from) { return response.json({ error: 'empty date_from' }) }
                                    let date_to = entities.encode(q.query.date_to); console.log('date_to : ', date_to); if (!date_to) { return response.json({ error: 'empty date_to' }) }

                                    dbc.query(`SELECT ${query_select} FROM ${database}_${params} WHERE mode='toefl' AND (${params_tanggal_filter} BETWEEN '${date_from}' AND '${date_to}')`, [], (error, data) => {

                                        if (error) {

                                            response.json({
                                                error: 'Data Error'
                                            })

                                        } else {

                                            if (!data.length > 0) return response.json({
                                                error: 'Not Found'
                                            })

                                            let headings = [];

                                            Object.keys(data[0]).map((key, index) => {
                                                let key_sync = capitalizeWords(key.replace(/_/g, " "))
                                                headings.push(
                                                    key_sync
                                                )
                                            })

                                            let dir = exportPath + '/' + bamboo_user;

                                            const convertJsonToExcel = () => {

                                                const workSheet = XLSX.utils.json_to_sheet(data, { origin: 'A2', skipHeader: true });
                                                const workBook = XLSX.utils.book_new();

                                                var wscols = [
                                                    {
                                                        width: 30,
                                                    },
                                                    {
                                                        width: 30,
                                                    },
                                                ];

                                                var wsrows = [

                                                ];

                                                // workSheet['!cols'] = wscols;
                                                // workSheet['!rows'] = wsrows;
                                                XLSX.utils.sheet_add_aoa(workSheet, [headings]); //heading: array of arrays

                                                XLSX.utils.book_append_sheet(workBook, workSheet, "export")
                                                // Generate buffer
                                                XLSX.write(workBook, { bookType: 'xlsx', type: "buffer" })

                                                // Binary string
                                                XLSX.write(workBook, { bookType: "xlsx", type: "binary" })

                                                XLSX.writeFile(workBook, dir + '/' + `${params}_export.xlsx`)

                                            }

                                            const _export = () => {

                                                Promise.all([
                                                    convertJsonToExcel()
                                                ]).then(() => {

                                                    response.json({
                                                        result: 'success',
                                                        title: 'Get Data',
                                                        data: bamboo_user + '/' + `${params}_export.xlsx`
                                                    })

                                                })

                                            }

                                            if (!fs.existsSync(dir)) {
                                                Promise.all([
                                                    fs.mkdirSync(dir)
                                                ]).then(() => {
                                                    console.log("Directory created");
                                                    _export()
                                                })
                                            } else {
                                                console.log("Directory already exist");
                                                _export()
                                            }

                                        }


                                    });

                                } else if (action === `pdf_${params}`) {

                                    let date_from = entities.encode(q.query.date_from); console.log('date_from : ', date_from); if (!date_from) { return response.json({ error: 'empty date_from' }) }
                                    let date_to = entities.encode(q.query.date_to); console.log('date_to : ', date_to); if (!date_to) { return response.json({ error: 'empty date_to' }) }

                                    dbc.query(`SELECT ${query_select} FROM ${database}_${params} WHERE mode='toefl' AND (${params_tanggal_filter} BETWEEN '${date_from}' AND '${date_to}')`, [], (error, data) => {

                                        if (error) {

                                            response.json({
                                                error: 'Data Error'
                                            })

                                        } else {


                                            if (!data.length > 0) return response.json({
                                                error: 'Not Found'
                                            })

                                            let dir = exportPath + '/' + bamboo_user;

                                            let data_header = [];
                                            let records = [];

                                            Object.keys(data[0]).map((key, index) => {
                                                data_header.push({
                                                    th: `<th>${capitalizeWords(key.replace(/_/g, " "))}</th>`,
                                                })
                                            })

                                            console.log('data_header : ', data_header)

                                            Object.keys(data)
                                                .forEach(function eachKey(key) {

                                                    console.log('key', key)
                                                    console.log('key index', data[key])

                                                    records.push(
                                                        data[key]
                                                    )

                                                });

                                            let data_loop_header = data_header.map((item, index) => {
                                                let { th } = item
                                                return (th)
                                            }).join("");

                                            let fix_array = query_select.replace(/\s/ig, "")

                                            let convert_array = fix_array.split(',');

                                            let data_loop_records = data.map((item, index) => (
                                                `
                                                    <tr>
                                                        ${convert_array.map((x, i) => {
                                                    return (
                                                        `
                                                                        <td>${eval('item.' + x)}</td>
                                                                    `
                                                    )
                                                }).join("")
                                                }
                                                    </tr>
                                                `
                                            )).join("");

                                            let file = {
                                                content: `
                                                <style>
                                                    *,::after,::before{-webkit-box-sizing:border-box;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Open Sans","Helvetica Neue",sans-serif;font-size:10px;margin:0;padding:0}html{line-height:1.5;-webkit-text-size-adjust:100%}body{color:#444;overflow-x:hidden;margin:20px}a{text-decoration:none;color:inherit}p{word-wrap:break-word;margin-bottom:8px}table{width:100%;min-width:100%;border-collapse:collapse;background-color:transparent}td,th{border:1px solid #ddd;text-align:left;padding:8px 12px}
                                                </style>
                                                <body>
                                                    <div>
                                                        <h3 style="margin-bottom: 10px">${capitalizeWords(params.replace(/_/g, " "))}</h3>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    ${data_loop_header}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${data_loop_records}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </body>
                                            `
                                            };

                                            let options = { format: 'A0' };
                                            // Example of options with args //
                                            // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

                                            const _pdf = () => {

                                                html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
                                                    console.log("PDF Buffer:-", pdfBuffer);
                                                    fs.writeFile(dir + '/' + `${params}_export.pdf`, pdfBuffer, function (err) {
                                                        if (err) {
                                                            response.json({
                                                                error: 'Error'
                                                            })
                                                        } else {
                                                            response.json({
                                                                result: 'success',
                                                                title: 'Get Data',
                                                                data: bamboo_user + '/' + `${params}_export.pdf`

                                                            })
                                                        }
                                                    });
                                                });

                                            }

                                            if (!fs.existsSync(dir)) {

                                                let folder = fs.mkdirSync(dir);

                                                if (folder === undefined) {
                                                    _pdf()
                                                }

                                            } else {

                                                console.log("Directory already exist");
                                                _pdf()

                                            }
                                        }


                                    });

                                } else if (action === `filter_${params}`) {

                                    let date_from = entities.encode(q.query.date_from); console.log('date_from : ', date_from); if (!date_from) { return response.json({ error: 'empty date_from' }) }
                                    let date_to = entities.encode(q.query.date_to); console.log('date_to : ', date_to); if (!date_to) { return response.json({ error: 'empty date_to' }) }

                                    dbc.query(`SELECT * FROM ${database}_${params} WHERE mode='toefl' AND (${params_tanggal_filter} BETWEEN '${date_from}' AND '${date_to}')`, [], (error, data) => {

                                        if (error) {
                                            console.log(error)
                                            response.json({
                                                error: 'Limit Error'
                                            })

                                        } else {

                                            if (data.length > 0) {

                                                response.json({
                                                    result: 'success',
                                                    title: 'Get Data',
                                                    data: {
                                                        count: data.length,
                                                        next: [1],
                                                        prev: [1],
                                                        last: [1],
                                                        pages: [1],
                                                        limit: 0,
                                                        offset: 0,
                                                        list: data
                                                    }
                                                })

                                            } else {

                                                response.json({
                                                    error: 'Data not found'
                                                })

                                            }

                                        }

                                    });

                                } else {

                                    response.json({
                                        error: 'Action Denied'
                                    })

                                }

                            } else if (level === 'user') {

                                if (action === `read_${params}`) {

                                    try {

                                        const excludedFields = [
                                            'id', 'bamboo_user', 'bamboo_chain',
                                            'sertifikat_cover', 'sertifikat_array', 'piagam_cover', 'piagam_array',
                                            'url_pdf', 'url_pdf_pembahasan', 'kunci_jawaban_pdf', 
                                        ];
                                        
                                        const columns = await runQuery(`SHOW COLUMNS FROM ${database}_app_tryout_category`, []);
                                        const allFields = columns.map(col => col.Field);

                                        const selectedFields = allFields.filter(field => !excludedFields.includes(field));

                                        if (selectedFields.length === 0) { return response.json({ error : 'Field not found'})}

                                        const countQuery = `SELECT COUNT(id) as length FROM ${database}_app_tryout_category 
                                            WHERE mode='toefl' AND status='active' AND sub_category_bamboo=?
                                        `;
                                        const count = await runQuery(countQuery, [bamboo_sub_category]);
                                        const dataCount = Math.ceil(count[0].length / limit);
                                        const countArray = Array.from({ length: dataCount }, (_, i) => i + 1);

                                        const paginate = (array, pageSize, pageNumber) =>
                                            array.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize);

                                        const next = paginate(countArray, 1, pagination_active);
                                        const prev = paginate(countArray, 1, pagination_active - 2);
                                        const last = [dataCount];
                                        const active = [pagination_active];

                                        const dataQuery = `SELECT ${selectedFields.join(', ')} FROM ${database}_app_tryout_category 
                                            WHERE mode='toefl' AND status='active' AND sub_category_bamboo=? ORDER BY id DESC LIMIT ? OFFSET ?
                                        `;
                                        const data = await runQuery(dataQuery, [bamboo_sub_category, limit, offset]);

                                        if(data.length === 0){
                                            return response.json({
                                                result: 'success',
                                                title: 'Koleksi Belum ada',
                                                data: {
                                                    count: count[0].length,
                                                    next,
                                                    prev,
                                                    last,
                                                    pages: active,
                                                    limit,
                                                    offset,
                                                    list: [],
                                                    count_category: 0,
                                                    payment: [],
                                                },
                                            });
                                        }

                                        const bambooList = data.map((item) => item.bamboo);

                                        try {
                                            const bambooListString = bambooList.map((bamboo) => `"${bamboo}"`).join(", ");
                                            const paymentQuery = `SELECT * FROM ${database}_app_tryout_payment 
                                                WHERE bamboo_user=? AND status='active' AND payment_status=? AND sub_category_bamboo=? AND category_bamboo IN (${bambooListString})
                                            `;
                                            const dataPayment = await runQuery(paymentQuery, [
                                                bamboo_user,
                                                'finish',
                                                bamboo_sub_category,
                                            ]);

                                            response.json({
                                                result: 'success',
                                                title: 'Successfully',
                                                data: {
                                                    count: count[0].length,
                                                    next,
                                                    prev,
                                                    last,
                                                    pages: active,
                                                    limit,
                                                    offset,
                                                    list: data,
                                                    count_category: data.length,
                                                    payment: dataPayment,
                                                },
                                            });
                                        } catch (error) {
                                            return response.json({
                                                error: error.message
                                            })
                                        }

                                    } catch (error) {
                                        return response.json({
                                            error: error.message
                                        })
                                    }

                                } else if (action === `search_${params}`) {

                                    try {
                                        if (!search) {
                                            return response.json({ error: 'Keyword Not Found' });
                                        }

                                        const excludedFields = [
                                            'id', 'bamboo_user', 'bamboo_chain',
                                            'sertifikat_cover', 'sertifikat_array', 'piagam_cover', 'piagam_array'
                                        ];
                                        
                                        const columns = await runQuery(`SHOW COLUMNS FROM ${database}_app_tryout_category`, []);
                                        const allFields = columns.map(col => col.Field);

                                        const selectedFields = allFields.filter(field => !excludedFields.includes(field));

                                        if (selectedFields.length === 0) { return response.json({ error : 'Field not found'})}
                                    
                                        const combine_search = `%${search}%`;
                                        const like = await runQuery(`SELECT ${selectedFields.join(', ')} FROM ${database}_app_tryout_category 
                                             WHERE status='active' AND mode='toefl' AND sub_category_bamboo=? AND ${config.query_search}`, [bamboo_sub_category, combine_search, combine_search]
                                        );
                                    
                                        if (like.length === 0) {
                                            return response.json({ error: 'Search Not Found' });
                                        }
                                    
                                        const bambooIds = like.map(item => item.bamboo);
                                        const placeholders = bambooIds.map(() => '?').join(', ');
                                    
                                        const data_payment = await runQuery(`SELECT * FROM ${database}_app_tryout_payment 
                                             WHERE bamboo_user=? AND payment_status=? AND status='active' AND category_bamboo IN (${placeholders})`, [bamboo_user, 'finish', ...bambooIds]
                                        );
                                    
                                        response.json({
                                            result: 'success',
                                            title: 'Successfully',
                                            data: {
                                                count: like.length,
                                                next: [1],
                                                prev: [1],
                                                last: [1],
                                                pages: [1],
                                                list: like,
                                                count_category: like.length,
                                                payment: data_payment
                                            }
                                        });
                                    } catch (error) {
                                        response.json({ error: error.message });
                                    }                                    

                                } else if (action === `data_${params}`) {

                                    try {
                                        const sub_category = await runQuery(`SELECT * FROM ${database}_app_tryout_sub_category WHERE status='active' AND mode='toefl'`, []);

                                        if (sub_category.length === 0) {
                                            return response.json({
                                                result: 'success',
                                                title: 'Successfully',
                                                data: {
                                                    sub_category: [],
                                                    voucher: []
                                                }
                                            });
                                        }
                                        
                                        const dataPromises = sub_category.map(async (item) => {
                                            const [data_tryout] = await runQuery(
                                                `
                                                    SELECT 
                                                        COUNT(e_default_app_tryout_category.id) as category_count, 
                                                        e_default_app_tryout_category.name as category_name, 
                                                        e_default_app_tryout_category.sub_category_bamboo,
                                                        e_default_app_tryout_timeline.cover
                                                    FROM e_default_app_tryout_category 
                                                        INNER JOIN e_default_app_tryout_timeline
                                                    ON e_default_app_tryout_category.sub_category_bamboo = e_default_app_tryout_timeline.sub_category_bamboo
                                                        WHERE e_default_app_tryout_category.mode='toefl' AND e_default_app_tryout_category.status='active' AND e_default_app_tryout_category.sub_category_bamboo=?
                                                    
                                                `,
                                                [item.bamboo]
                                            );

                                            return data_tryout
                                                ? { ...item, ...data_tryout }
                                                : null;
                                        });

                                        const data_count = (await Promise.all(dataPromises)).filter(Boolean);

                                        const voucher = await runQuery(`SELECT * FROM ${database}_app_voucher_data WHERE status=?`,['active']);

                                        // console.log('data_count', data_count)

                                        return response.json({
                                            result: 'success',
                                            title: 'Successfully',
                                            data: {
                                                sub_category: data_count,
                                                voucher: voucher
                                            }
                                        });
                                    } catch (error) {
                                        return response.json({
                                            error: error.message
                                        })
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
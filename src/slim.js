let fetch = require('node-fetch');
const MAX_PAGES = 5;

async function slim(req, res, next) {
  let url = 'https://' + process.env.API_DOMAIN + req.originalUrl.replace('/slim', '');
  console.log("url is", url);
  console.log("url is", req.query);
  let includes = req.query.includes ? req.query.includes.split(',') : [];
  let joined = [];
  try {
    for (let i = 1; i < MAX_PAGES; i++) {
      let queryParamChar = "&";
      if (url.indexOf("?") == -1) {
        queryParamChar = "?"
      }
      let resp = await fetch(url + queryParamChar + "page=" + i);
      let resp_json = await resp.json();
      let result = [];
      for (let i = 0; i < resp_json.result.length; i++) {
        result.push({});
        let obj = Object.entries(resp_json.result[i]);
        obj.forEach(function(entry) {
          let each_key = entry[0];
          let each_value = entry[1];
          if (includes.indexOf(each_key) != -1) {
            result[i][each_key] = each_value;
          }
        });
      }
      Object.entries(resp_json.result).forEach(function(entry) {
      });
      joined = joined.concat(result);
      if (!resp_json.result) {
        return res.status(resp_json.status).json(resp_json);
      }
      if (resp_json.count == 0 ) {
        break;
      }
    }
  } catch (err) {
    console.log("Unable to reach ", url, err);
    return res.status(503).json({
      message: "Connectivity issue - please retry later"
    });
  }
  return res.json({
    count: joined.length,
    result: joined
  });
}

module.exports = slim;

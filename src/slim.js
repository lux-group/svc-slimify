let fetch = require('node-fetch');
const MAX_PAGES = 5;

function reduceObject(object, includes, deepIncludes, trim, parentChain) {
  let reduced = {};
  let obj = Object.entries(object);
  obj.forEach(function(entry) {
    let each_key = entry[0];
    let each_value = entry[1];
    if (Array.isArray(each_value) && trim.indexOf(each_key) != -1) {
      reduced[each_key] = [each_value[0]];
    } else if (deepIncludes[each_key]) {
      reduced[each_key] = reduceObject(each_value, deepIncludes[each_key], {}, trim, parentChain.concat(each_key));
    } else {
      if (includes.indexOf(each_key) != -1) {
        reduced[each_key] = each_value;
      }
    }
  });
  return reduced;
}

async function slim(req, res, next) {
  let url = 'https://' + process.env.API_DOMAIN + req.originalUrl.replace('/slim', '');
  console.log("url is", url);
  let includes = req.query.includes ? req.query.includes.split(',') : [];
  let trim = req.query.trim ? req.query.trim.split(',') : [];
  let nestedIncludes = {};
  for (let i = 0; i < includes.length; i++) {
    let splitIncludes = includes[i].split(".");
    if (splitIncludes.length > 1) {
      nestedIncludes[splitIncludes[0]] = splitIncludes.slice(1);
    }
  }
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
        result.push(reduceObject(resp_json.result[i], includes, nestedIncludes, trim, []));
      }
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

let fetch = require('node-fetch');
const MAX_PAGES = 5;

// option 1 - have lowest_price_package, don't have lowest_price_package.something
// option 2 - have lowest_price_package, have lowest_price_package.something_else
// option 3 - have lowest_price_package, have lowest_price_package.this

function shouldFollowChain(object, includes, parentChain, key) {
  // search for parentChain (lowest_price_package) in includes
  // have something
  // have what we are searching for
  let haveFilter = false;
  let haveSpecific = false;
  for (let i = 0; i < includes.length; i++) {
    if (parentChain != "" && includes[i].indexOf(parentChain) == 0) {
      haveFilter = true;
    }
    if (includes[i].indexOf(parentChain + key) == 0) {
      haveSpecific = true;
    }
  }
  if (haveSpecific) { return true; }
  if (haveFilter && haveSpecific) { return true; }
  if (haveFilter && !haveSpecific) { return false; }
  return false;
}

function reduceObject(object, includes, trim, parentChain) {
  let reduced = {};
  let obj = Object.entries(object);
  obj.forEach(function(entry) {
    let each_key = entry[0];
    let each_value = entry[1];
    let foo = shouldFollowChain(each_value, includes, parentChain, each_key);
    if (Array.isArray(each_value) && trim.indexOf(each_key) != -1) {
      reduced[each_key] = [each_value[0]];
    } else if (shouldFollowChain(each_value, includes, parentChain, each_key) && typeof each_value == "object" && !Array.isArray(each_value)) {
      reduced[each_key] = reduceObject(each_value, includes, trim, parentChain + each_key + ".");
    } else if (includes.indexOf(parentChain + each_key) != -1) {
      reduced[each_key] = each_value;
    } else {
      // not adding to result
    }
  });
  return reduced;
}

async function slim(req, res, next) {
  let url = 'https://' + process.env.API_DOMAIN + req.originalUrl.replace('/slim', '');
  let includes = req.query.includes ? req.query.includes.split(',') : [];
  let trim = req.query.trim ? req.query.trim.split(',') : [];
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
        result.push(reduceObject(resp_json.result[i], includes, trim, []));
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
  res.set('Cache-Control', 'public, max-age=180');
  return res.json({
    count: joined.length,
    result: joined
  });
}

module.exports = slim;

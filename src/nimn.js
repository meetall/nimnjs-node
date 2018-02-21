var chars = require("./chars");
var valParser = require("./val_parser");

function nimn(schema) {
    this.e_schema = schema;
}

nimn.prototype.encode = function(jObj){
    var isData = hasData(jObj);
    if(isData === true){
        return this.e(jObj,this.e_schema)
    }else{
        return isData;
    }
}

function getKey(obj,i){
    return obj[Object.keys(obj)[i]];
}
nimn.prototype.e = function(jObj,e_schema){
    var properties = e_schema.properties;
    var keys = Object.keys(properties);
    var len = keys.length;
    
    var str = "";
    for(var i=0; i< len; i++){
        var key = keys[i];
        var nextKey = keys[i+1];
        if(properties[key].type === "array"){
            var isData = hasData(jObj[key]);
            if(isData === true){
                var itemSchema = getKey(properties[key].properties,0);
                var itemSchemaType = itemSchema.type;
                var arr_len = jObj[key].length;
                str = appendBoundryCharIfNeeded(str,jObj[key][0]);
                for(var arr_i=0;arr_i < arr_len;arr_i++){
                    //if arraySepChar presents, next item is an array item.
                    if(itemSchemaType !== "array" && itemSchemaType !== "object" ){
                        //str += chars.arraySepChar;
                        //str = appendBoundryCharIfNeeded(str,jObj[key]);
                        str += checkForNilOrUndefined(jObj[key][arr_i],itemSchemaType);
                    }else{
                        str += /* chars.arraySepChar + */ this.e(jObj[key][arr_i],itemSchema) ;
                    }
                    if(arr_len > arr_i+1){
                        str += chars.arraySepChar;
                    }
                }
                str = appendBoundryCharIfNeeded(str);
            }else{
                str += isData;
            }
        }else if(properties[key].type === "object"){
            var isData = hasData(jObj[key]);
            if(isData === true){
                var itemType = properties[key];
                //boundry chars is needed for decoding
                str = appendBoundryCharIfNeeded(str);
                str += this.e(jObj[key],itemType);
                //str = appendBoundryCharIfNeeded(str);
            }else{
                str += isData;
            }
        }else{
            str = appendBoundryCharIfNeeded(str,jObj[key]);
            str += checkForNilOrUndefined(jObj[key],properties[key].type);
        }
    }
    return str;
}

var checkForNilOrUndefined= function(a,type){
    if(a === undefined || a === null) return chars.nilPremitive;
    else return parseValue(a,type);
}

var parseValue = function(val,type){
    if(type === "string") return val;
    else if(type === "boolean") return valParser.parseBoolean(val);
    else if(type === "number") return val;
    else if(type === "date") return val;
    else return val;
}
/**
 * Check if the given object is empty, null, or undefined. Returns true otherwise.
 * @param {*} jObj 
 */
function hasData(jObj){
    if(jObj === undefined || jObj === null){
        return chars.nilChar;
    }else  if( jObj.length === 0 || Object.keys(jObj).length === 0){
        return chars.emptyChar;
    }else{
        return true;
    }
}

/**
 * Append Boundry char if last char or next char are not null/missing/empty char
 * @param {*} str 
 */
function appendBoundryCharIfNeeded(str,next){
    if( str.length > 0 && !isNonAppChar(str[str.length -1]) &&  !isNonDataValue(next) ){
            str += chars.boundryChar;
    }
    return str;
}

//TODO: change name
function isNonDataValue(ch){
    return ch === null 
    || ch === undefined 
    || ( typeof ch === "object" && ch.length === 0 )
    || ch === true
    || ch === false;
}

//TODO: convert into array for fast comparision
function isNonAppChar(ch){
    return ch === chars.nilChar ||  ch === chars.nilPremitive
     ||  ch === chars.boundryChar 
     || ch === chars.emptyChar
     || ch === chars.yesChar
     || ch === chars.noChar;
}



module.exports = nimn;
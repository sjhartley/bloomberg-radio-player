import './App.css';
import React from 'react';
import Hls from 'hls.js';
import $ from "jquery";
import "jquery.marquee";

const axios=require('axios');
const cheerio=require('cheerio');


const loading_img=require('./loading.png');
const loaded_img=require('./ready.png');

const city_img=require('./city.jpg');

function get_bloomberg(){
  var url="https://playerservices.streamtheworld.com/api/livestream?transports=hls&version=1.8&mount=WBBRAMAAC48";
  //this url is used to retrieve the bloomberg stream url

  return new Promise(function(resolve, reject){
    axios.get(url).then(function(response){
      var body=cheerio.load(response.data, {xmlMode: true});
      var transport_suf=body("transport")
      console.log(`transport_suf=${transport_suf}`);
      var server_ip=body("server ip");
      console.log(`server_ip=${server_ip}`);
      var mount=body("mount");
      console.log(`mount=${mount}`);
      var playlistUrl=`https://${server_ip.first().text()}/${mount.text()}${transport_suf.attr('mountSuffix')}`;
      console.log(`playlistUrl=${playlistUrl}`);
      resolve(playlistUrl);
    });
  });
}

class App extends React.Component {

    constructor(props){
      super(props);

      this.state={
        stream_url: "Loading..."
      };
    }


    setupPlayer(){
      let self=this;
      return new Promise(function(resolve, reject){
        get_bloomberg().then(function(playlistUrl){
          axios.get(playlistUrl).then(function(response){
            var body=response.data.toString();
            console.log(body);
            var http_search=body.search("https://");
            console.log(http_search);
            var sessionStreamUrl=body.slice(http_search).split('\n')[0];
            console.log(playlistUrl);
            console.log(`bloomberg radio session stream=${sessionStreamUrl}`);

            let bloomberg_stream=document.getElementById('bloomberg_stream');
            if (Hls.isSupported()) {
              var hls = new Hls();
              hls.loadSource(sessionStreamUrl);
              hls.attachMedia(bloomberg_stream);
              hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                bloomberg_stream.muted = false;
                bloomberg_stream.poster=loaded_img;
                resolve(sessionStreamUrl);
              });
            }
            else{
              reject();
            }
          })
        });
      });
    }

  showMarquee(){
    this.$el.marquee({
      duration: 10000,
      delayBeforeStart: 0,
    }).bind("finished", () => {
        this.$el.marquee("destroy");
        document.getElementById("marquee").innerHTML=this.state.stream_url;
        this.showMarquee();
    });
  }

  componentDidMount() {
    let self=this;
    this.setupPlayer().then(function(url){
      console.log(url);
      self.setState({stream_url: `Streaming at ${url}`}, function(){
        self.showMarquee();
      });
    });

  }

  render() {
    return (
            <div id="root">
              <div style={{height: '100%', backgroundImage: `url('${city_img}')`, backgroundSize: 'cover'}}>
                <h1 style={{color: '#FF0000'}}>Bloomberg Radio</h1>

                <div style={{color: '#00FF00'}}  id="marquee" ref={(el) => (this.$el = $(el))}></div>

                <div id="stream-container">
                  <video style={{backgroundColor: '#FF0000'}} controls poster={loading_img} id="bloomberg_stream"></video>
                </div>
              </div>
            </div>
    );
  }
}

export default App;

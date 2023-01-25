# NJMetroRealTime
## 根目录的config.json

配置需要展示在页面上的线路

```
{
  "defaultLine": "L2",
  "lines": [
    {
      "value": "L1",
      "label": "1号线"
    },
    {
      "value": "L2",
      "label": "2号线"
    },
    {
      "value": "L3",
      "label": "3号线"
    },
    {
      "value": "L4",
      "label": "4号线"
    },
    {
      "value": "L7",
      "label": "7号线北段"
    },
    {
      "value": "L10",
      "label": "10号线"
    },
    {
      "value": "S1",
      "label": "S1机场线"
    },
    {
      "value": "S3",
      "label": "S3宁和线"
    },
    {
      "value": "S6",
      "label": "S6宁句线"
    },
    {
      "value": "S7",
      "label": "S7宁溧线"
    },
    {
      "value": "S8",
      "label": "S8宁天线"
    },
    {
      "value": "S9",
      "label": "S9宁高线"
    }
  ]
}

```



## assets目录：

### 1.icon目录

线路logo，如"L1_icon.svg"

logo.png: 启动页面和桌面展示的图标

下面的train目录存放列车图标

### 2.lineInfo目录

存放线路配置信息，格式如下

stationIds一般从0按顺序排列即可

```
{
  "line": "L1",
  "lineName": "号线",
  "color": "#009ACE",
  "stations": [
    "八卦洲大桥南",
    "笆斗山",
    "燕子矶",
    "吉祥庵",
    "晓庄",
    "迈皋桥",
    "红山动物园",
    "南京站",
    "新模范马路",
    "玄武门",
    "鼓楼",
    "珠江路",
    "新街口",
    "张府园",
    "三山街",
    "中华门",
    "安德门",
    "天隆寺",
    "软件大道",
    "花神庙",
    "南京南站",
    "双龙大道",
    "河定桥",
    "胜太路",
    "百家湖",
    "小龙湾",
    "竹山路",
    "天印大道",
    "龙眠大道",
    "南医大·江苏经贸学院",
    "南京交院",
    "中国药科大学"
  ],
  "stationIds": [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31
  ]
}
```

### 3.timetable目录

存放列车时刻信息，按线路建文件夹，每个文件夹存放两个时刻表文件，一个是工作日，一个是休息日

单个车次信息如下：

trainId代表车次

direction代表运行方向，只分0和1，0代表下行，1代表上行(下行指开往线路配置中stations的最后一站)，暂时不支持带有支线的线路

route代表本次列车停靠站点id

level代表列车等级，0为普通车，1为小交路车，2为大站快车，3为贯通快车或直达快车，4为出入库车

schedule代表列车运行时刻表，包括每站的到达出发时间，和停靠站点id

```
 "L11": {
        "trainId": "L11",
        "direction": 0,
        "route": "0-1-2-3-4-5-6-7-8-9-10-11-12-13-14-15-16-17-18-19-20-21-22",
        "level": 1,
        "schedule": [
            {
                "stationId": 0,
                "departTime": "05:52:10",
                "arrivalTime": "05:51:25"
            },
            {
                "stationId": 1,
                "departTime": "05:54:21",
                "arrivalTime": "05:53:51"
            },
            {
                "stationId": 2,
                "departTime": "05:56:26",
                "arrivalTime": "05:55:56"
            },
            {
                "stationId": 3,
                "departTime": "05:58:23",
                "arrivalTime": "05:57:53"
            },
            {
                "stationId": 4,
                "departTime": "06:00:30",
                "arrivalTime": "05:59:45"
            },
            {
                "stationId": 5,
                "departTime": "06:03:31",
                "arrivalTime": "06:02:46"
            },
            {
                "stationId": 6,
                "departTime": "06:05:44",
                "arrivalTime": "06:05:14"
            },
            {
                "stationId": 7,
                "departTime": "06:08:12",
                "arrivalTime": "06:07:22"
            },
            {
                "stationId": 8,
                "departTime": "06:10:56",
                "arrivalTime": "06:10:26"
            },
            {
                "stationId": 9,
                "departTime": "06:12:54",
                "arrivalTime": "06:12:24"
            },
            {
                "stationId": 10,
                "departTime": "06:15:21",
                "arrivalTime": "06:14:36"
            },
            {
                "stationId": 11,
                "departTime": "06:17:09",
                "arrivalTime": "06:16:39"
            },
            {
                "stationId": 12,
                "departTime": "06:19:32",
                "arrivalTime": "06:18:42"
            },
            {
                "stationId": 13,
                "departTime": "06:21:34",
                "arrivalTime": "06:21:04"
            },
            {
                "stationId": 14,
                "departTime": "06:23:24",
                "arrivalTime": "06:22:54"
            },
            {
                "stationId": 15,
                "departTime": "06:26:15",
                "arrivalTime": "06:25:45"
            },
            {
                "stationId": 16,
                "departTime": "06:29:40",
                "arrivalTime": "06:28:55"
            },
            {
                "stationId": 17,
                "departTime": "06:32:13",
                "arrivalTime": "06:31:43"
            },
            {
                "stationId": 18,
                "departTime": "06:34:34",
                "arrivalTime": "06:34:04"
            },
            {
                "stationId": 19,
                "departTime": "06:36:31",
                "arrivalTime": "06:36:01"
            },
            {
                "stationId": 20,
                "departTime": "06:39:28",
                "arrivalTime": "06:38:38"
            },
            {
                "stationId": 21,
                "departTime": "06:42:33",
                "arrivalTime": "06:42:03"
            },
            {
                "stationId": 22,
                "departTime": "06:44:45",
                "arrivalTime": "06:44:15"
            }
        ]
```


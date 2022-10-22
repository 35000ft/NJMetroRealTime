export default {
    binarySearch(target, array) {
        let start = 0;
        let end = array.length;

        if (target < array[start]) {
            //如果当前时间在首班车前
            return -1;
        } else if (target > array[end - 1]) {
            //如果当前时间在末班车后
            return array.length;
        }

        mid = parseInt((start + end) / 2);
        while (mid > start) {
            if (target == array[mid]) {
                return mid;
            }
            else if (target > array[mid]) {
                start = mid;
            }
            else {
                //15:36 < 16:00
                end = mid;
            }
            mid = parseInt((start + end) / 2);
        }
        //没有找到，返回target以后的时间(较大的一个)
        return end;
    }
}
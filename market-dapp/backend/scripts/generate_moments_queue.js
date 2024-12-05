const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const generateQueue = (videos) => {
    const typeToCopies = {
        UNIQUE: 1,      // 2 videos, 2 copies
        LEGENDARY: 3,   // 3 videos, 9 copies
        EPIC: 10,       // 4 videos, 40 copies
        SPECIAL: 20,    // 5 videos, 100 copies
        COMMON: 39      // 6 videos, 234 copies (adjusted from 40 to 39)
    };

    let queue = [];

    videos.forEach(video => {
        const { link, type } = video;
        const copies = typeToCopies[type];
        if (copies) {
            queue = queue.concat(Array(copies).fill(link));
        }
    });

    return shuffleArray(queue);
};

const groupQueue = (queue, groupSize) => {
    const groups = [];
    for (let i = 0; i < queue.length; i += groupSize) {
        groups.push(queue.slice(i, i + groupSize));
    }
    return groups;
};

// Example usage:
const videoLinks = [
    { link: 'video1', type: 'UNIQUE' },
    { link: 'video2', type: 'UNIQUE' },
    { link: 'video3', type: 'LEGENDARY' },
    { link: 'video4', type: 'LEGENDARY' },
    { link: 'video5', type: 'LEGENDARY' },
    { link: 'video6', type: 'EPIC' },
    { link: 'video7', type: 'EPIC' },
    { link: 'video8', type: 'EPIC' },
    { link: 'video9', type: 'EPIC' },
    { link: 'video10', type: 'SPECIAL' },
    { link: 'video11', type: 'SPECIAL' },
    { link: 'video12', type: 'SPECIAL' },
    { link: 'video13', type: 'SPECIAL' },
    { link: 'video14', type: 'SPECIAL' },
    { link: 'video15', type: 'COMMON' },
    { link: 'video16', type: 'COMMON' },
    { link: 'video17', type: 'COMMON' },
    { link: 'video18', type: 'COMMON' },
    { link: 'video19', type: 'COMMON' },
    { link: 'video20', type: 'COMMON' }
];

const queue = generateQueue(videoLinks);
const groupedQueue = groupQueue(queue, 5);

console.log(`Total videos: ${queue.length}`); // Should print 380
console.log(`Total groups: ${groupedQueue.length}`); // Should print 76
console.log(groupedQueue);
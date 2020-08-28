import AggregateError from 'aggregate-error'

export default async (
	iterable:(() => Promise<any>)[],
	mapper:(arg1:any, index:number) => any,
	{
		concurrency = Infinity,
        stopOnError = true,
        again = 3
	} = {}
):Promise<any> => {
	return new Promise((resolve, reject) => {
		if (typeof mapper !== 'function') {
			throw new TypeError('Mapper function is required');
		}

		if (!((Number.isSafeInteger(concurrency) || concurrency === Infinity) && concurrency >= 1)) {
			// throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
			throw new TypeError(`期望 \`concurrency\` 是一个整数并且大于 0 或者是 \`Infinity\`, 得到的是： \`${concurrency}\` (${typeof concurrency})`);
        }
        
		const result:any[] = [];
		const errors:any[] = [];
		const iterator = iterable[Symbol.iterator]();
		let isRejected = false;
		let isIterableDone = false;
		let resolvingCount = 0;
		let currentIndex = 0;

		const next = ():void => {
			if (isRejected) {
				return;
			}

			const nextItem = iterator.next();
			const index = currentIndex;
			currentIndex++;

			if (nextItem.done) {
				isIterableDone = true;

				if (resolvingCount === 0) {
					if (!stopOnError && errors.length !== 0) {
						reject(new AggregateError(errors));
					} else {
						resolve(result);
					}
				}

				return;
			}

			resolvingCount++;

			(async ():Promise<any> => {
                let value = nextItem.value;
                let again1 = again
                while(again1) {
                    try {
                        const element : Promise<any> = await value()
                        result[index] = await mapper(element, index);
                        resolvingCount--;
                        again1 = 0
                        next();
                    } catch (error) {
                        again1--
                        if(again1 <= 0) { 
                            if (stopOnError) {
                                isRejected = true;
                                reject(error);
                            } else {
                                errors.push(error);
                                resolvingCount--;
                                next();
                            }
                        }
                    }
                }
			})();
		};

		for (let i = 0; i < concurrency; i++) {
			next();

			if (isIterableDone) {
				break;
			}
		}
	});
};

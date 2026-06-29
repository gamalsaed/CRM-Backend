import { Query as MongooseQuery, Model } from "mongoose";

type Query<T> = {
  fields?: string;
  page?: string;
  limit?: string;
} & Partial<T>;

class APIFeatures<T> {
  usedFields: string[];
  queryObject: Query<T>;
  Modal: Model<T>;
  query: MongooseQuery<any, any>;

  constructor(queryObject: Query<T>, Modal: Model<T>, usedFields: string[]) {
    this.usedFields = usedFields;
    this.queryObject = queryObject;
    this.Modal = Modal;
    this.query = Modal.find();
  }

  filter() {
    const filters: Record<string, any> = {};

    for (let key in this.queryObject) {
      if (this.usedFields.includes(key)) {
        const typedKey = key;
        filters[typedKey] = this.queryObject[key as keyof Query<T>];
      }
    }

    this.query = this.query.find(filters);
    return this;
  }

  fields() {
    if (this.queryObject["fields"]) {
      let selectedFields = this.queryObject["fields"].split(",").join(" ");
      this.query = this.query.select(selectedFields);
    } else {
      this.query = this.query.select("-__v -password");
    }
    return this;
  }

  pagination() {
    const page = Number(this.queryObject.page);
    const limit = Number(this.queryObject.limit);

    const skip = page * limit - limit;
    this.query.skip(skip).limit(limit);
    return this;
  }
}
export default APIFeatures;

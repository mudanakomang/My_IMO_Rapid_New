import { StyleSheet } from "react-native";
const COLORS = {
  primary: "#018d0c",
  icon: "#FCB152",
  price: "#202020",
  background: "#202020",
  black: "#000000",
};
const Styles = StyleSheet.create({
  
  profileItemContainer: {
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 10,
    padding: 15,
  },
  productflatgridContainer: {
    flexGrow: 1,
  },
  productName: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: "bold",
    paddingVertical: 2,
    paddingHorizontal: 13,
    textTransform: "uppercase",
  },
  price: {
    fontSize: 13,
    color: COLORS.price,
    fontWeight: "600",
    paddingVertical: 2,
    paddingHorizontal: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  //HOME STYLES
  //HOME STYLES -> FLATGRID
  headerView: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",

    marginBottom: 10,
  },
  flatgridContainer: {
    justifyContent: "center",
    flexGrow: 1,
    paddingBottom: 50,
    // backgroundColor: "white",
  },
  gridView: {
    flex: 1,
  },
  itemContainer: {
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    borderRadius: 10,
    marginVertical: 10,
    alignSelf: "center",
  },
  itemName: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: "bold",
    paddingVertical: 10,
    paddingHorizontal: 13,
    textAlign: "center",
    textTransform: "uppercase",
  },
  itemCode: {
    fontWeight: "600",
    fontSize: 12,
    color: "#fff",
  },

  //Profile Styles
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  title: {
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 4,
    borderColor: "#20232a",
    borderRadius: 6,
    backgroundColor: "#61dafb",
    color: "#20232a",
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
  },
  logo: {
    width: "100%",
    height: "80%",
  },
});

export { Styles, COLORS };

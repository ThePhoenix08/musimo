import { AVAILABLE_TESTS } from "./availableTests.js";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const AvailableTests = () => {
  return (
    <div className="place-items-center grid p-8">
      <h2 className="text-xl font-semibold">Available Tests</h2>
      <Table className="border-2 border-gray-300 my-4">
        <TableHeader>
          <TableRow>
            <TableHead>Test Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {AVAILABLE_TESTS.map((test) => (
            <TableRow key={test.route}>
              <TableCell>
                <Link to={test.route} className="text-blue-500 hover:underline">
                  {test.name}{"🔗"}
                </Link>
              </TableCell>
              <TableCell>{test.description}</TableCell>
              <TableCell>{test.active ? "Active" : "Inactive"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
export default AvailableTests;

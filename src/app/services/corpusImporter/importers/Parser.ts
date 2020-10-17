/**
 * Interface that define a Parser that produces some Result of an Input.
 * @param Input the Input-Type
 * @param Output the Output-Type
 */
export default interface Parser<Input, Result> {

    /**
     * Parses in input to some output.
     * @param value the Input
     */
    parse(value: Input) : Result

}
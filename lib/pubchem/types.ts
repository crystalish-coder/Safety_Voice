export interface PubChemCidResponse {
  IdentifierList?: {
    CID?: number[];
  };
  Fault?: {
    Code?: string;
    Message?: string;
    Details?: string[];
  };
}

export interface PubChemPropertyResponse {
  PropertyTable?: {
    Properties?: Array<{
      CID: number;
      Title?: string;
      IUPACName?: string;
      MolecularFormula?: string;
      MolecularWeight?: string | number;
      CanonicalSMILES?: string;
      IsomericSMILES?: string;
      InChI?: string;
      InChIKey?: string;
    }>;
  };
}

export interface PubChemGhsParsed {
  signalWords: string[];
  pictograms: Array<{
    code?: string;
    name?: string;
    url?: string;
  }>;
  hazardStatements: Array<{
    code?: string;
    text: string;
    source?: string;
  }>;
  precautionaryStatements: Array<{
    code?: string;
    text: string;
    source?: string;
  }>;
  hazardClasses: Array<{
    name: string;
    category?: string;
    source?: string;
  }>;
}

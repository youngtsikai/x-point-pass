import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorRestrictedComponent } from './visitor-restricted.component';

describe('VisitorRestrictedComponent', () => {
  let component: VisitorRestrictedComponent;
  let fixture: ComponentFixture<VisitorRestrictedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorRestrictedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorRestrictedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
